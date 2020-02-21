var fs = require('fs');
var express = require('express');
var router = express.Router();

/* GET users listing. */
router.post('/', async (req, res, next) => {
  const { avatar: avatarBase64 } = req.body;
  const avatarData = Buffer.from(avatarBase64, 'base64');
  const avatarPath = `avatars/image${new Date().getTime()}.png`;
  await new Promise((resolve, reject) => {
    fs.writeFile(`public/${avatarPath}`, avatarData, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
  res.json({ avatar: avatarPath });
});

module.exports = router;
