const axios = require('axios');
const settings = require('../settings');

const baseConfig = {
  "1gb": { ram: 1000, disknya: 1000, cpu: 40 },
  "2gb": { ram: 2000, disknya: 1000, cpu: 60 },
  "3gb": { ram: 3000, disknya: 2000, cpu: 80 },
  "4gb": { ram: 4000, disknya: 2000, cpu: 100 },
  "5gb": { ram: 5000, disknya: 3000, cpu: 120 },
  "6gb": { ram: 6000, disknya: 3000, cpu: 140 },
  "7gb": { ram: 7000, disknya: 4000, cpu: 160 },
  "8gb": { ram: 8000, disknya: 4000, cpu: 180 },
  "9gb": { ram: 9000, disknya: 5000, cpu: 200 },
  "10gb": { ram: 10000, disknya: 5000, cpu: 220 }
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Metode tidak diizinkan' });
  }

  const { username, email, password, ram } = req.body;
  const config = baseConfig[ram];
  if (!config) {
    return res.status(400).json({ status: 'error', message: 'RAM tidak valid!' });
  }

  try {
    const userResponse = await axios.post(`${settings.PANEL_URL}/api/application/users`, {
      username,
      email,
      first_name: username,
      last_name: 'Bot',
      password
    }, {
      headers: {
        'Authorization': `Bearer ${settings.API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'Application/vnd.pterodactyl.v1+json'
      }
    });

    const userId = userResponse.data.attributes.id;

    const serverResponse = await axios.post(`${settings.PANEL_URL}/api/application/servers`, {
      name: username,
      user: userId,
      egg: settings.EGG_ID,
      nest: settings.NEST_ID,
      docker_image: "ghcr.io/parkervcp/yolks:nodejs_21",
      startup: "npm start",
       environment : {
                     INST : "npm",
                     USER_UPLOAD : "0",
                     AUTO_UPDATE : "0",
                     CMD_RUN : "npm start"
                },
      limits: {
        memory: config.ram,
        swap: 0,
        disk: config.disknya,
        io: 500,
        cpu: config.cpu
      },
      feature_limits: {
        databases: 1,
        backups: 1,
        allocations: 1
      },
      allocation: {
        default: settings.ALLOCATION_ID
      }
    }, {
      headers: {
        'Authorization': `Bearer ${settings.API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'Application/vnd.pterodactyl.v1+json'
      }
    });

    const serverData = serverResponse.data.attributes;

    res.status(200).json({
      status: 'success',
      username,
      email,
      panel_url: settings.PANEL_URL,
      server_id: serverData.identifier
    });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({
      status: 'error',
      message: err.response?.data || err.message
    });
  }
};