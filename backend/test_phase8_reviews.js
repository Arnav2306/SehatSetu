import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Review from './src/models/Review.js';
import Appointment from './src/models/Appointment.js';
import Doctor from './src/models/Doctor.js';
import Hospital from './src/models/Hospital.js';
import {
  createReview,
  getPublicProviderReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  getAdminReviews,
  updateReviewStatus,
} from './src/controllers/review.controller.js';
import app from './src/app.js';

console.log('--- Starting Phase 8: Patient Reviews & Moderation Verification ---');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
  }
}

// 1. Model Schema Validation Tests
runTest('Review schema rejects rating < 1', () => {
  const rev = new Review({
    patient: new mongoose.Types.ObjectId(),
    appointment: new mongoose.Types.ObjectId(),
    rating: 0,
    comment: 'Too low rating',
  });
  const err = rev.validateSync();
  assert.ok(err, 'Validation should fail for rating < 1');
  assert.ok(err.errors.rating, 'Rating should have error');
});

runTest('Review schema rejects rating > 5', () => {
  const rev = new Review({
    patient: new mongoose.Types.ObjectId(),
    appointment: new mongoose.Types.ObjectId(),
    rating: 6,
    comment: 'Too high rating',
  });
  const err = rev.validateSync();
  assert.ok(err, 'Validation should fail for rating > 5');
  assert.ok(err.errors.rating, 'Rating should have error');
});

runTest('Review schema rejects non-integer rating', () => {
  const rev = new Review({
    patient: new mongoose.Types.ObjectId(),
    appointment: new mongoose.Types.ObjectId(),
    rating: 3.5,
    comment: 'Fractional rating',
  });
  const err = rev.validateSync();
  assert.ok(err, 'Validation should fail for fractional rating');
  assert.ok(err.errors.rating, 'Rating should have error');
});

runTest('Review schema rejects empty comment', () => {
  const rev = new Review({
    patient: new mongoose.Types.ObjectId(),
    appointment: new mongoose.Types.ObjectId(),
    rating: 5,
    comment: '',
  });
  const err = rev.validateSync();
  assert.ok(err, 'Validation should fail for empty comment');
  assert.ok(err.errors.comment, 'Comment should have error');
});

runTest('Review schema rejects comment > 500 chars', () => {
  const rev = new Review({
    patient: new mongoose.Types.ObjectId(),
    appointment: new mongoose.Types.ObjectId(),
    rating: 5,
    comment: 'A'.repeat(501),
  });
  const err = rev.validateSync();
  assert.ok(err, 'Validation should fail for comment > 500 characters');
  assert.ok(err.errors.comment, 'Comment should have error');
});

runTest('Review schema defaults status to pending and accepts valid fields', () => {
  const rev = new Review({
    patient: new mongoose.Types.ObjectId(),
    appointment: new mongoose.Types.ObjectId(),
    rating: 5,
    comment: 'Great doctor and consultation experience!',
  });
  const err = rev.validateSync();
  assert.equal(err, undefined, 'Validation should pass');
  assert.equal(rev.status, 'pending', 'Default status should be pending');
});

// Helper for mocking Express req/res
function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
}

// 2. Controller Input Validation Tests
await runAsyncTest('createReview rejects invalid appointmentId', async () => {
  const req = {
    body: { appointmentId: 'invalid-id', rating: 5, comment: 'Nice' },
    user: { _id: new mongoose.Types.ObjectId() },
  };
  const res = mockRes();
  await createReview(req, res, () => {});
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.status, 'error');
  assert.match(res.body.message, /Valid appointment ID is required/i);
});

await runAsyncTest('createReview rejects invalid rating (decimal/out of range)', async () => {
  const req = {
    body: { appointmentId: new mongoose.Types.ObjectId().toString(), rating: 4.5, comment: 'Nice' },
    user: { _id: new mongoose.Types.ObjectId() },
  };
  const res = mockRes();
  await createReview(req, res, () => {});
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.status, 'error');
  assert.match(res.body.message, /Rating must be an integer between 1 and 5/i);
});

await runAsyncTest('createReview rejects empty or whitespace comment', async () => {
  const req = {
    body: { appointmentId: new mongoose.Types.ObjectId().toString(), rating: 5, comment: '   ' },
    user: { _id: new mongoose.Types.ObjectId() },
  };
  const res = mockRes();
  await createReview(req, res, () => {});
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.status, 'error');
  assert.match(res.body.message, /Review comment is required/i);
});

// 3. Ownership and Completion Eligibility Validation
await runAsyncTest('createReview rejects appointment owned by different patient (403 Forbidden)', async () => {
  const patientA = new mongoose.Types.ObjectId();
  const patientB = new mongoose.Types.ObjectId();
  const fakeAppt = {
    _id: new mongoose.Types.ObjectId(),
    patient: patientA,
    status: 'completed',
    slotStart: new Date(Date.now() - 86400000), // past
  };

  const origFindById = Appointment.findById;
  Appointment.findById = () => Promise.resolve(fakeAppt);

  try {
    const req = {
      body: { appointmentId: fakeAppt._id.toString(), rating: 5, comment: 'Great visit' },
      user: { _id: patientB }, // patient B trying to review patient A's appointment
    };
    const res = mockRes();
    await createReview(req, res, () => {});
    assert.equal(res.statusCode, 403);
    assert.match(res.body.message, /You can only review your own appointments/i);
  } finally {
    Appointment.findById = origFindById;
  }
});

await runAsyncTest('createReview rejects non-completed appointments (scheduled / cancelled)', async () => {
  const patient = new mongoose.Types.ObjectId();
  const fakeAppt = {
    _id: new mongoose.Types.ObjectId(),
    patient,
    status: 'scheduled',
    slotStart: new Date(Date.now() - 86400000),
  };

  const origFindById = Appointment.findById;
  Appointment.findById = () => Promise.resolve(fakeAppt);

  try {
    const req = {
      body: { appointmentId: fakeAppt._id.toString(), rating: 5, comment: 'Visit was ok' },
      user: { _id: patient },
    };
    const res = mockRes();
    await createReview(req, res, () => {});
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Only completed appointments are eligible for review/i);
  } finally {
    Appointment.findById = origFindById;
  }
});

await runAsyncTest('createReview rejects future appointment even if marked completed', async () => {
  const patient = new mongoose.Types.ObjectId();
  const fakeAppt = {
    _id: new mongoose.Types.ObjectId(),
    patient,
    status: 'completed',
    slotStart: new Date(Date.now() + 86400000), // tomorrow
  };

  const origFindById = Appointment.findById;
  Appointment.findById = () => Promise.resolve(fakeAppt);

  try {
    const req = {
      body: { appointmentId: fakeAppt._id.toString(), rating: 5, comment: 'Future visit' },
      user: { _id: patient },
    };
    const res = mockRes();
    await createReview(req, res, () => {});
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Cannot review future appointments/i);
  } finally {
    Appointment.findById = origFindById;
  }
});

await runAsyncTest('createReview rejects duplicate review for same appointment (409 Conflict)', async () => {
  const patient = new mongoose.Types.ObjectId();
  const fakeAppt = {
    _id: new mongoose.Types.ObjectId(),
    patient,
    status: 'completed',
    slotStart: new Date(Date.now() - 86400000),
  };

  const origFindById = Appointment.findById;
  const origFindOne = Review.findOne;
  Appointment.findById = () => Promise.resolve(fakeAppt);
  Review.findOne = () => Promise.resolve({ _id: new mongoose.Types.ObjectId() }); // existing review

  try {
    const req = {
      body: { appointmentId: fakeAppt._id.toString(), rating: 5, comment: 'Duplicate review' },
      user: { _id: patient },
    };
    const res = mockRes();
    await createReview(req, res, () => {});
    assert.equal(res.statusCode, 409);
    assert.match(res.body.message, /A review has already been submitted for this appointment/i);
  } finally {
    Appointment.findById = origFindById;
    Review.findOne = origFindOne;
  }
});

// 4. Ownership Protection on Edit/Delete
await runAsyncTest('updateReview prevents editing other patients reviews (403 Forbidden)', async () => {
  const patientA = new mongoose.Types.ObjectId();
  const patientB = new mongoose.Types.ObjectId();
  const fakeReview = {
    _id: new mongoose.Types.ObjectId(),
    patient: patientA,
    rating: 4,
    comment: 'Original comment',
  };

  const origFindById = Review.findById;
  Review.findById = () => Promise.resolve(fakeReview);

  try {
    const req = {
      params: { id: fakeReview._id.toString() },
      body: { comment: 'Hacked comment' },
      user: { _id: patientB },
    };
    const res = mockRes();
    await updateReview(req, res, () => {});
    assert.equal(res.statusCode, 403);
    assert.match(res.body.message, /You cannot edit another patient's review/i);
  } finally {
    Review.findById = origFindById;
  }
});

await runAsyncTest('deleteReview prevents deleting other patients reviews by non-admin (403 Forbidden)', async () => {
  const patientA = new mongoose.Types.ObjectId();
  const patientB = new mongoose.Types.ObjectId();
  const fakeReview = {
    _id: new mongoose.Types.ObjectId(),
    patient: patientA,
  };

  const origFindById = Review.findById;
  Review.findById = () => Promise.resolve(fakeReview);

  try {
    const req = {
      params: { id: fakeReview._id.toString() },
      user: { _id: patientB, role: 'patient' },
    };
    const res = mockRes();
    await deleteReview(req, res, () => {});
    assert.equal(res.statusCode, 403);
    assert.match(res.body.message, /You cannot delete another patient's review/i);
  } finally {
    Review.findById = origFindById;
  }
});

// 5. Admin Moderation Validation
await runAsyncTest('updateReviewStatus validates status to be approved or rejected', async () => {
  const req = {
    params: { id: new mongoose.Types.ObjectId().toString() },
    body: { status: 'invalid_status' },
  };
  const res = mockRes();
  await updateReviewStatus(req, res, () => {});
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /Status must be either "approved" or "rejected"/i);
});

// 6. Public Endpoint Filters strictly to approved status
await runAsyncTest('getPublicProviderReviews enforces approved-only filter', async () => {
  let capturedFilter = null;
  const origFind = Review.find;
  const origCount = Review.countDocuments;
  const origAggregate = Review.aggregate;

  Review.find = (filter) => {
    capturedFilter = filter;
    return {
      select: () => ({
        populate: () => ({
          sort: () => ({
            skip: () => ({
              limit: () => ({
                lean: () => Promise.resolve([]),
              }),
            }),
          }),
        }),
      }),
    };
  };
  Review.countDocuments = () => Promise.resolve(0);
  Review.aggregate = () => Promise.resolve([]);

  try {
    const doctorId = new mongoose.Types.ObjectId().toString();
    const req = {
      params: { doctorId },
      query: {},
    };
    const res = mockRes();
    await getPublicProviderReviews(req, res, () => {});
    assert.equal(res.statusCode, 200);
    assert.ok(capturedFilter, 'Filter must be passed');
    assert.equal(capturedFilter.status, 'approved', 'Must strictly query status: "approved"');
  } finally {
    Review.find = origFind;
    Review.countDocuments = origCount;
    Review.aggregate = origAggregate;
  }
});

// 7. Route authorization protection check: Non-admin users cannot moderate reviews
await runAsyncTest('authorize middleware blocks non-admin users from admin moderation endpoints', async () => {
  const patientUser = { _id: new mongoose.Types.ObjectId(), role: 'patient' };
  const doctorUser = { _id: new mongoose.Types.ObjectId(), role: 'doctor' };
  const adminUser = { _id: new mongoose.Types.ObjectId(), role: 'admin' };

  const { authorize } = await import('./src/middleware/auth.js');
  const adminOnly = authorize('admin');

  // Test patient blocked
  let blockedPatient = false;
  const resPatient = mockRes();
  adminOnly({ user: patientUser }, resPatient, () => {
    blockedPatient = false;
  });
  if (resPatient.statusCode === 403) blockedPatient = true;
  assert.equal(blockedPatient, true, 'Patient must be rejected with 403');

  // Test doctor blocked
  let blockedDoctor = false;
  const resDoctor = mockRes();
  adminOnly({ user: doctorUser }, resDoctor, () => {
    blockedDoctor = false;
  });
  if (resDoctor.statusCode === 403) blockedDoctor = true;
  assert.equal(blockedDoctor, true, 'Doctor must be rejected with 403');

  // Test admin allowed
  let allowedAdmin = false;
  const resAdmin = mockRes();
  adminOnly({ user: adminUser }, resAdmin, () => {
    allowedAdmin = true;
  });
  assert.equal(allowedAdmin, true, 'Admin must be permitted to proceed');
});

console.log(`\nResults: ${passedTests}/${totalTests} unit tests passed.`);

