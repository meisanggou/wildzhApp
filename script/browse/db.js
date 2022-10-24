var _DB_FILE_PATH = 'fs://db/'
var _DB_NAME = 'en_box'
var _DB_T2 = 't_files2'
var DB_SYNC_ING = false;
var dirty_items = [];

function init_db() {
    var db = api.require('db');
    ret = db.openDatabaseSync({
        name: _DB_NAME,
        path: _DB_FILE_PATH
    });
    if (ret.status != true) {
        alert(JSON.stringify(ret));
    } else {
        init_db_table2();
    }

}

function init_db_table2() {
    var db = api.require('db');
    var c_sql = 'CREATE TABLE %s(top_dir varchar(255), name varchar(100), is_folder boolean, is_hide boolean, num INTEGER, mod_time varchar(20),PRIMARY KEY (top_dir,name))'
    db.executeSql({
        name: _DB_NAME,
        // sql: 'DROP TABLE t_files2'
        sql: str_format(c_sql, [_DB_T2])
    }, function(ret, err) {
        if (ret.status) {
            db_sync();
        } else {
            if (err.msg.indexOf('already exists') < 0) {
                alert(JSON.stringify(err));
            }
            show_directory(current_dir);
        }

    });
}

function db_select(top_dir, name) {
    var db = api.require('db');
    var sql = str_format('SELECT top_dir,name,is_folder,is_hide,num,mod_time FROM %s', [_DB_T2])
    if (top_dir != null) {
        if (name == "") {
            sql += str_format(" WHERE top_dir like '%s%'", [str_add_suffix(top_dir)]);
        } else {
            sql += str_format(" WHERE top_dir='%s'", [str_add_suffix(top_dir)]);
            if (name != null) {
                sql += str_format(" AND name='%s'", [name]);
            }
        }
    }

    var ret = db.selectSqlSync({
        name: _DB_NAME,
        sql: sql
    });
    if (ret.status) {
        // alert(JSON.stringify(ret));
    } else {
        alert(JSON.stringify(ret));
    }
    return ret.data
}

function db_insert(items, batch_num) {
    if (batch_num == null) {
        batch_num = 30;
    }
    var db = api.require('db');
    var index = 0;
    var sql_prefix = str_format("INSERT INTO %s (top_dir,name,is_folder,is_hide,num,mod_time) VALUES ", [_DB_T2]);
    var i_sql = sql_prefix
    while (index < items.length) {
        var item = items[index];
        v = [str_add_suffix(item['top_dir']), item['name'], item['is_folder'], item['is_hide'], item['num'], item['mod_time']];
        i_sql += str_format("('%s', '%s', %s, %s, %s, '%s'),", v);
        if ((index + 1) % batch_num == 0 || index == items.length - 1) {
            db.executeSqlSync({
                name: _DB_NAME,
                sql: str_trim(i_sql, ',')
            });
            if (ret.status) {} else {
                alert(JSON.stringify(err));
            }
            i_sql = sql_prefix
        }
        index += 1;

    }

}

function db_update(item) {
    var top_dir = str_add_suffix(item.top_dir);
    var name = item.name;
    var num = item.num;
    var db = api.require('db');
    var sql = str_format("UPDATE %s set num=%s WHERE top_dir='%s' and name='%s'", [_DB_T2, num, top_dir, name])
    var ret = db.executeSqlSync({
        name: _DB_NAME,
        sql: sql
    });
    if (ret.status == false) {
        console.info(JSON.stringify(ret));
    }
}

function db_update_dir_num(path, num){
  var db = api.require('db');
  var item = path_split2(path);
  if(!('top_dir' in item)){
    return false;
  }
  var top_dir = item.top_dir;
  var name = item.name;
  var sql = str_format("UPDATE %s set num=%s WHERE top_dir='%s' and name='%s'", [_DB_T2, num, top_dir, name]);
  var ret = db.executeSql({
      name: _DB_NAME,
      sql: sql
  }, function(ret, err){
    if(err){
      console.info(JSON.stringify(err));
    }
  });
}

function db_update_name(top_dir, name, new_name) {
    var db = api.require('db');
    top_dir = str_add_suffix(top_dir);
    var sql = str_format("UPDATE %s set name='%s' WHERE top_dir='%s' and name='%s'", [_DB_T2, new_name, top_dir, name]);
    var ret = db.executeSqlSync({
        name: _DB_NAME,
        sql: sql
    });
    if (ret.status == false) {
        console.info(JSON.stringify(ret));
    }
}

function db_delete(items) {
    var db = api.require('db');
    for (var j = 0; j < items.length; j++) {
        var ret = db.executeSqlSync({
            name: _DB_NAME,
            sql: str_format("DELETE FROM %s WHERE top_dir='%s' AND name='%s'", [_DB_T2, items[j].top_dir, items[j].name])
        });
        if (ret.status) {} else {
            alert(JSON.stringify(ret));
        }
    }
}

function db_delete_dir(top_dir) {
    top_dir = str_add_suffix(top_dir);
    var db = api.require('db');
    var sql = str_format("DELETE FROM %s WHERE top_dir LIKE '%s%'", [_DB_T2, top_dir]);
    var ret = db.executeSqlSync({
        name: _DB_NAME,
        sql: sql
    });
    if (ret.status) {} else {
        alert(JSON.stringify(ret));
    }
}

function db_rename_dir(top_dir, new_top_dir) {
    top_dir = str_add_suffix(top_dir);
    new_top_dir = str_add_suffix(new_top_dir);
    var db = api.require('db');
    var old_l = top_dir.length + 1;
    var sql = str_format("UPDATE %s SET top_dir='%s'||Substr(top_dir,%s) WHERE top_dir LIKE '%s%'", [_DB_T2, new_top_dir, old_l, top_dir]);

    var ret = db.executeSqlSync({
        name: _DB_NAME,
        sql: sql
    });
    if (ret.status) {} else {
        alert(JSON.stringify(ret));
    }
}

function db_upgrade() {
    var his_tables = ['t_files'];
    var his_exist_t = [];
    var new_t = _DB_T2;
    var db = api.require('db');
    var ret = db.selectSqlSync({
        name: _DB_NAME,
        sql: "SELECT name FROM sqlite_master"
    });
    if (ret.status == false) {
        console.error(JSON.stringify(ret));
        return false;
    }

    for (var i = 0; i < his_tables.length; i++) {
        for (var j = 0; j < ret.data.length; j++) {
            if (his_tables[i] == ret.data[j].name) {
                his_exist_t.push(his_tables[i]);
                break;
            }
        }
    }
    if (his_exist_t.length <= 0) {
        console.info('no history table');
        return true;
    }
    var his_t = his_exist_t[0];
    var sql = null;
    // 根据历史版本的不同 拼接相应的升级sql
    if (his_t == 't_files') {
        var ts = [new_t, his_t, new_t, his_t, new_t, his_t];
        sql = str_format('UPDATE %s set is_hide=(SELECT is_hide FROM %s WHERE %s.top_dir=%s.top_dir AND %s.name=%s.name)', ts);
    }

    if (sql == null) {
        console.error(str_format('Not support from %s upgrade to %s', [his_t, new_t]));
        return false;
    }
    var ret = db.executeSqlSync({
        name: _DB_NAME,
        sql: sql
    });
    if (ret.status == true) {
        for (var k = 0; k < his_exist_t.length; k++) {
            db.executeSql({
                name: _DB_NAME,
                sql: str_format('DROP TABLE %s', [his_exist_t[k]])
            }, function(ret, err) {
                console.info(JSON.stringify(err));
            });
        }
    } else {
        console.error(JSON.stringify(ret));
    }

}

function db_update_hide(top_dir, name) {
    var db = api.require('db');
    var sql = str_format("UPDATE %s set is_hide=1 WHERE top_dir='%s' and name='%s'", [_DB_T2, top_dir, name])
    var ret = db.executeSqlSync({
        name: _DB_NAME,
        sql: sql
    });
}
