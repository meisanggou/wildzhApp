var is_downing = false; // 是否下载文件中
var sync_cache_list = []; // 用于保存 要同步的文件和目录
var sync_cache_dirs = [];  // 本次同步 涉及到的目录 需要更新目录的 数目
var sync_download_list = [];  // 本次同步要下载的文件
var downloaded_num = 0;  // 已下载的文件数
var _IMPORT_ERROR = false; // 下载或者获取数据过程中出错

function start_import_from_server(server){
  sync_cache_list = [];
  if(server.indexOf('http') != 0){
    server = 'http://' + server;
  }
  sync_server_url = server; // "http://10.180.206.8:8080"
  getOrSetCacheData(_storge_server_key, sync_server_url);
  IMPORTING = true;
  set_progress_value(0);
  downloaded_num = 0;  // 已下载的文件数
  UIListView.hide();

  _net_request(sync_server_url, '', sync_data);
  sync_cache_dirs.push(path_split2(current_dir));
}

function _net_request(url, basic_dir, success_func){
  set_progress('正在获取访问：' + url, 0);
  api.ajax({
      url: url,
      method: 'GET',
  }, function(ret, err) {
      if (ret) {
          success_func(basic_dir, ret);
      } else {
          api.alert({
              msg: JSON.stringify(err)
          });
          _IMPORT_ERROR = true;
          sync_completed();
      }
  });
}

function download_file(item){
  var url = sync_server_url + item.path;
  set_progress('正在下载：' + url, 0);
  var save_path = item.top_dir + '/' + item.name;
  api.download({
      url: url,
      savePath: save_path,
      // report: true,
      cache: true,
      allowResume: false
  }, function(ret, err) {
      if(ret.state == 0){
        // 未下载完成
        return false;
      }
      is_downing = false;
      downloaded_num += 1;
      if (ret.state == 1) {
          //下载成功
          db_insert([item]);
      } else {
      }
      start_download();
  });
}

function start_download(){
  if(is_downing){
    return false;
  }
  if(sync_download_list.length <= 0){
    sync_completed();
    return false;
  }
  var _num = sync_download_list.length + downloaded_num;
  var pValue = (downloaded_num * 100) / _num;
  set_progress_value(pValue);
  is_downing = true;
  var item = sync_download_list.shift();
  download_file(item);
}

function sync_data(basic_dir, data){
  var top_dir = current_dir + basic_dir;
  var db_items = db_select(top_dir);
  for(var i=0,l=data.length;i<l;i++){
    var item = data[i];
    item.skip = false;
    item.db_existed = false;
    for(var k=0, dl=db_items.length;k<dl;k++){
      if(item.name == db_items[k].name){
        item.db_existed = true;
        if(item.type == 'file'){
          // 只要是同步过来的是 个文件， 但是文件名已存在 不处理
          item.skip = true;
          break;
        }
        if(db_items[k].is_folder == "0"){
          // 说明数据库同名的 是个文件  而 同步的是个目录 不一致 不处理
          item.skip = true;
          break;
        }
        break;
      }
    }
    if(item.skip == true){
      continue;
    }
    item.is_hide = '0';
    item.mod_time = timestamp_2_datetime();
    item['path'] = basic_dir + '/' + item['name'];
    item.top_dir = top_dir;
    sync_cache_list.push(item);
  }
  while (sync_cache_list.length > 0) {
    var item = sync_cache_list.shift();
    if(item.type == 'file'){
      item.is_folder = 0;
      item.num = item.size;
      sync_download_list.push(item);
      start_download();
    }
    else{
      sync_cache_dirs.push(item);
      item.is_folder = 1;
      item.num = 0;
      if(item.db_existed == false){
        db_insert([item]);
      }
      create_en_dir(item.top_dir, item.name);
      var url = sync_server_url + item.path;
      _net_request(url, item.path, sync_data);
      break;
    }
  }

  sync_completed();

}

function sync_completed(){
  // 同步结束 刷新页面
  if(sync_cache_list.length <= 0 && sync_download_list.length <= 0){
    // 处理本次涉及到的目录
    while (sync_cache_dirs.length > 0) {
      var item = sync_cache_dirs.shift();
      var sub_num =  db_select(item.top_dir + '/' + item.name).length;
      item.num = sub_num;
      db_update(item);
    }
    // 刷新页面
    set_progress('同步完成', null);
    UIListView.show();
    show_directory(current_dir);
    IMPORTING = false;
  }
}

// 以下是上报
function start_report(server, items){
  if(server.indexOf('http') != 0){
    server = 'http://' + server;
  }
  _report_action(server, items, 0, 100);
}

function _report_end(){
  IMPORTING = false;
  set_progress('上传结束', null);

}

function _report_action(server, items, start, num){
  var p = start * 100 / items.length;
  var data = [];
  for(var i=0; i<num; i++){
    if(start + i >= items.length){
      break
    };
    data.push(items[start + i].name);
  }
  if(data.length <= 0){
    console.info('上传完成');
    set_progress('上传完成', null);
    api.toast({
      msg: '上报完成，共' + items.length + '个条目',
      duration: 8000,
      location: 'bottom'
  });
    _report_end();
    return;
  }
  set_progress('正在上报 ' +  data[0] + ' 到：' + server, p);
  api.ajax({
      url: server,
      method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        data: {
            body: {'items': data}
        }
  }, function(ret, err) {
      if (ret) {
        _report_action(server, items, start + num, num);
      } else {
          api.alert({
              msg: JSON.stringify(err)
          });
          _report_end();
      }
  });
}