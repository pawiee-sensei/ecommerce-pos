const stockLogModel = require('../models/stockLogModel');

module.exports = {

  // RETURN ALL LOGS
  getLogs: async (req, res) => {
    try {
      const logs = await stockLogModel.getAllLogs();
      return res.json({ success: true, logs });
    } catch (err) {
      console.error("Stock logs fetch error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

};
