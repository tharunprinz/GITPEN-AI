import express from 'express';
import {
  scanRepository,
  getScanStatus,
  getScanHistory,
  getScanDetails,
  getScanFileContent
} from '../controllers/scanController.js';

const router = express.Router();

router.post('/', scanRepository);              // POST   /api/scan         — start async scan
router.get('/history', getScanHistory);        // GET    /api/scan/history — recent scans list
router.get('/status/:jobId', getScanStatus);   // GET    /api/scan/status/:jobId — poll job
router.get('/:id', getScanDetails);            // GET    /api/scan/:id     — full scan result
router.get('/:id/file', getScanFileContent);   // GET    /api/scan/:id/file?path= — file content

export default router;
