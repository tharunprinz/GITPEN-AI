import mongoose from 'mongoose';

/**
 * ScanJob tracks the lifecycle of an async repository scan.
 * POST /api/scan creates a job immediately and returns the jobId.
 * The actual scan runs in the background and updates this document.
 * Frontend polls GET /api/scan/status/:jobId until status = "completed".
 */
const ScanJobSchema = new mongoose.Schema(
  {
    repoUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    phase: {
      type: String,
      default: 'Queued',
    }, // Human-readable phase for UI display
    scanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scan',
      default: null,
    }, // Set when completed — points to the full Scan document
    error: { type: String, default: null },
    createdAt: { type: Date, default: Date.now, expires: 86400 }, // Auto-delete after 24h
  },
  { timestamps: true }
);

export const ScanJob = mongoose.model('ScanJob', ScanJobSchema);
export default ScanJob;
