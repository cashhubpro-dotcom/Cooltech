// backend/utils/technicianStatus.js
// Works out a technician's status and open-job count from their REAL jobs,
// instead of flipping the status on every single assign / complete:
//   busy      - the technician has at least one job "in_progress"
//   available - otherwise (jobs that are only "assigned" do not make them busy)
//   jobs      - number of open jobs (assigned + in_progress)
// "off" and "on_leave" are set by hand on the Dispatch Board and are never
// overwritten here. Call it after any change to a job's status or technician.
import Technician from '../models/Technician.js';
import Job from '../models/Job.js';

export async function syncTechnicianStatus(technician) {
  const id = technician?._id ?? technician;
  if (!id) return;
  const tech = await Technician.findById(id).select('status');
  if (!tech) return;

  const mine = { technician: id, isDeleted: { $ne: true } };
  const [inProgress, open] = await Promise.all([
    Job.countDocuments({ ...mine, status: 'in_progress' }),
    Job.countDocuments({ ...mine, status: { $in: ['assigned', 'in_progress'] } }),
  ]);

  const update = { jobs: open };
  if (!['off', 'on_leave'].includes(tech.status)) {
    update.status = inProgress > 0 ? 'busy' : 'available';
  }
  await Technician.findByIdAndUpdate(id, update);
}