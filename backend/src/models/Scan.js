import mongoose from 'mongoose';

const ScanSchema = new mongoose.Schema(
  {
    repoUrl: { type: String, required: true, index: true },
    owner: { type: String, required: true },
    name: { type: String, required: true },
    branch: { type: String, default: 'main' },
    commitHash: { type: String, required: true, index: true },
    securityScore: { type: Number, required: true, min: 0, max: 100 },
    summary: { type: String, required: true },
    vulnerabilities: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        severity: { type: String, enum: ['critical', 'high', 'medium', 'low'], required: true },
        file: { type: String, required: true },
        lineStart: { type: Number },
        lineEnd: { type: Number },
        codeSnippet: { type: String },
        recommendation: { type: String, required: true },
      },
    ],
    codeQuality: {
      score: { type: Number, required: true, min: 0, max: 100 },
      readability: { type: String },
      complexity: { type: String },
      suggestions: [{ type: String }],
    },
    dependencyHealth: {
      status: { type: String, enum: ['healthy', 'warning', 'critical'], required: true },
      vulnerabilitiesCount: { type: Number, default: 0 },
      outdatedDependencies: [
        {
          name: { type: String, required: true },
          currentVersion: { type: String },
          latestVersion: { type: String },
          severity: { type: String },
        },
      ],
    },
    configHardening: [
      {
        setting: { type: String, required: true },
        status: { type: String, enum: ['secure', 'warning', 'failed'], required: true },
        description: { type: String, required: true },
        recommendation: { type: String },
      },
    ],
    analyzedFiles: [
      {
        path: { type: String, required: true },
        size: { type: Number },
        type: { type: String },
      },
    ],
    createdAt: { type: Date, default: Date.now, expires: 86400 }, // 24-hour expiration/TTL index
  },
  { timestamps: true }
);

export const Scan = mongoose.model('Scan', ScanSchema);
export default Scan;
