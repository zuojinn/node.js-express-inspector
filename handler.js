const formidable = require('formidable')
const config = require('./config')
const db = require('./common/db')
const path = require('path')

exports.showIndex = (req, res) => {
  res.render('index')
}

exports.showAdd = (req, res) => {
  res.render('add')
}
exports.getMusicList = (req, res) => {
  db.query('SELECT * FROM music', (err, rows) => {
    if (err) {
      throw err;
    }
    console.log(rows)
    // 返回一个 JSON 响应
    rows.forEach(function(v,i,a){
      v.img = JSON.parse(v.img);
      v.music = JSON.parse(v.music);
      if(v.img){
        v.img.forEach(function(vj,j,aj){
          if(vj){
            aj[j] = JSON.parse(vj);
          }
        });
      }
    });
    res.json({
      list: rows
    })
  })
}

exports.showAdd = (req, res) => {
  res.render('add')
}

exports.doAdd = (req, res) => {
  const form = new formidable.IncomingForm()
  form.uploadDir = config.uploadDir // 配置上传文件的路径
  form.keepExtensions = true // 保持扩展名
  form.maxFieldsSize = 20 * 1024 * 1024 // 配置上传文件的大小
  form.parse(req, (err, fields, files) => {
    const title = fields.title;
    const singer = fields.singer;
    let music = {
      "name":path.basename(files.music.path),
      "original_name":files.music.name
    }
    let img = fields["consult_img[]"],imgStr="";
    if(typeof(img) == 'string'){
      let imgList = [];
      imgList.push(img)
      img = imgList;
    }
    imgStr = JSON.stringify(img);
    music = JSON.stringify(music);
    db.query('INSERT INTO music(title, singer, music, img) VALUES(?, ?, ?, ?)', [
      title,
      singer,
      music,
      imgStr
    ], (err, rows) => {
      if (err) {
        throw err;
      }
      res.redirect('/')
    })
  })
}
exports.uploads = (req, res) => {
  const form = new formidable.IncomingForm()
  form.uploadDir = config.uploadDir // 配置上传文件的路径
  form.keepExtensions = true // 保持扩展名
  form.maxFieldsSize = 20 * 1024 * 1024 // 配置上传文件的大小
  form.parse(req, (err, fields, files) => {
    if(!files){
      return res.status(500).send('no files were uploaded');
    }
    const name = files.file.path.replace(form.uploadDir, "").replace('\'', "");
    return res.json({
      "code": 200,
      "jsonrpc":"2.0",
      "result":"上传成功",
      "info":{
        "url":'uploads/',
        "path":name,
        "img_url":files.file.path,
        "name":name,
        "suffix":files.file.type,
        "byte":files.file.size,
        "original_name":files.file.name
      }
      })
    })
}
exports.showEdit = (req, res) => {
  const id = req.query.id;
  db.query('SELECT * FROM music WHERE id=?',[id],(err, rows) => {
    if(err){
      throw err
    }
    // 返回一个 JSON 响应
    // rows.forEach(function(v,i,a){
    //   v.img = JSON.parse(v.img);
    //   v.img.forEach(function(vj,j,aj){
    //     aj[j] = JSON.parse(vj);
    //   });
    // });
    
    // 返回一个 JSON 响应
    rows.forEach(function(v,i,a){
      v.music = JSON.parse(v.music);
    });

    res.render('edit',{
      music: rows[0]
    })
  })

}
exports.doEdit = (req, res) => {
    const form = new formidable.IncomingForm()
    form.uploadDir = config.uploadDir // 配置上传文件的路径
    form.keepExtensions = true // 保持扩展名
    form.maxFieldsSize = 20 * 1024 * 1024 // 配置上传文件的大小
    form.parse(req, function(err, fields, files) {
      const id = req.query.id
      const title = fields.title;
      const singer = fields.singer;
      let music = {
        "name":path.basename(files.music.path),
        "original_name":files.music.name
      }
      let img = fields["consult_img[]"],imgStr="";
      if(typeof(img) == 'string'){
        let imgList = [];
        imgList.push(img)
        img = imgList;
      }
      imgStr = JSON.stringify(img);
      music = JSON.stringify(music);

      let update = 'UPDATE music SET title=?,singer=?,img=?,music=? WHERE id=?';
      let updateKey = [title, singer, imgStr, music, id];
      if(!files.music || !files.music.name){
        update = 'UPDATE music SET title=?,singer=?,img=? WHERE id=?';
        updateKey = [title, singer, imgStr, id];
      }

      db.query(update , updateKey, (err, rows) => {
        if (err) {
          throw err;
        }
        if(rows.affectedRows !==1){
          return res.json({
            code: 2001,
            msg: 'update failed'
          })
        }
        res.redirect('/')
      })
    }) 
}
exports.doRemove = (req, res) => {
  const id = req.query.id
  db.query('DELETE FROM music WHERE id=?', [id], (err, rows) => {
    if (err) {
      throw err;
    }
    if (rows.affectedRows !== 1) {
      // 删除歌曲
      // 1000
      // 1001
      return res.json({
        code: 1001,
        msg: 'remove failed'
      })
    }
    res.json({
      code: 1000,
      msg: 'remove success'
    })
  })
}