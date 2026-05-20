const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../data/landingConfig.json');

exports.getLandingConfig = (req, res) => {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      res.json({ data: JSON.parse(data) });
    } else {
      res.status(404).json({ message: 'Configuration not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error reading configuration', error: error.message });
  }
};

exports.updateLandingConfig = (req, res) => {
  try {
    const newConfig = req.body;
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf8');
    res.json({ message: 'Configuration updated successfully', data: newConfig });
  } catch (error) {
    res.status(500).json({ message: 'Error saving configuration', error: error.message });
  }
};
