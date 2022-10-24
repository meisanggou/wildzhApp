var SERVER_ENDPOINT = 'http://192.168.137.1:2400'
    // var SERVER_ENDPOINT = 'http://192.168.0.106:2400'
var SERVER_ENDPOINT = 'https://wild.gene.ac'
var KEY_USER_TOKEN = 'user.token';

// 时间相关
function get_timestamp() {
    var timestamp = Date.parse(new Date());
    timestamp = timestamp / 1000;
    return timestamp;
}

function get_timestamp2() {
    return parseInt(get_timestamp() / 1000);
}

function timestamp_2_datetime(ts) {
    if(ts == null){
      var dt  = new Date();
    }
    else{
      var dt = new Date(parseInt(ts) * 1000);
    }
    var y = dt.getFullYear();
    var M = dt.getMonth() + 1;
    var d = dt.getDate();
    var h = dt.getHours();
    var m = dt.getMinutes();
    var s = dt.getSeconds();
    var n_str = y + "-" + M + "-" + d + " " + h + ":" + m + ":" + s
    return n_str;
}

function timestamp_2_date(ts) {
    var dt = new Date(parseInt(ts) * 1000);
    var y = dt.getFullYear();
    var M = dt.getMonth() + 1;
    var d = dt.getDate();
    var h = dt.getHours();
    var m = dt.getMinutes();
    var s = dt.getSeconds();
    var n_str = y + "-" + M + "-" + d;
    return n_str;
}

function ajax_request(url, method, data, success_func) {
    var r_url = url;
    api.ajax({
        url: r_url,
        method: method,
        headers: {
            'X-APP-Version': api.version,
            'X-REQ-API': 'v1',
            'Content-Type': 'application/json;charset=utf-8'
        },
        data: {
            body: data
        }
    }, function(ret, err) {
        if (ret) {
            success_func(ret);
        } else {
            api.alert({
                msg: JSON.stringify(err)
            });
        }
    });
}

// 网络请求相关
function my_request(url, method, data, success_func) {
    var r_url = SERVER_ENDPOINT + url;
    api.ajax({
        url: r_url,
        method: method,
        headers: {
            'X-APP-Version': api.version,
            'X-REQ-API': 'v1',
            'Content-Type': 'application/json;charset=utf-8'
        },
        data: {
            body: data
        }
    }, function(ret, err) {
        if (ret) {
            success_func(ret);
        } else {
            api.alert({
                msg: JSON.stringify(err)
            });
        }
    });
}

function my_auth_request(url, method, data, successFunc, failFunc) {
    var r_url = SERVER_ENDPOINT + url;
    var token_data = getOrSetCurrentUserData();
    if (token_data == null) {
        return false;
    }
    if (!'access_token' in token_data) {
        return false;
    }

    var auth_token = token_data['access_token'] + ':' + get_timestamp() + ':sha2:' + 'sign';
    var req_data = null;
    if (method != 'GET' && data != null) {
        req_data = {
            body: data
        };
    }
    api.ajax({
        url: r_url,
        method: method,
        headers: {
            'X-APP-Version': api.version,
            'X-REQ-API': 'v1',
            'Content-Type': 'application/json;charset=utf-8',
            'X-OAuth-Token': auth_token
        },
        data: req_data
    }, function(ret, err) {
        if (ret) {
            if (successFunc) {
                successFunc(ret);
            }
        } else {
            if (err.statusCode == 401) {
                var body = err.body;
                if (body == 'token_not_storage' || body == 'token_bad_format') {
                    api.openWin({
                        name: '重新登录',
                        url: 'widget://html/me/login.html',
                        pageParam: {
                            name: 're_login'
                        }
                    });
                    return false;
                }
            } else if (failFunc) {
                failFunc(console.err);
            } else {
                api.alert({
                    msg: JSON.stringify(err)
                });
            }
        }
    });
}

function my_auth_request2(request) {
    var url = request.url;
    var method = 'GET';
    if ('method' in request) {
        method = request.method;
    }
    var data = null;
    if ('data' in request) {
        data = request.data;
    }
    var successFunc = null;
    if ('success' in request) {
        successFunc = request.success;
    }
    var failFunc = null;
    if ('fail' in request) {
        failFunc = request.fail;
    }
    return my_auth_request(url, method, data, successFunc, failFunc);
}


// 数据处理
function size_to_str(size) {
    if (size < 1024) {
        return size + 'B';
    }
    size = (size / 1024).toFixed(2);
    if (size < 1024) {
        return size + 'KB';
    }
    size = (size / 1024).toFixed(2);
    if (size < 1024) {
        return size + 'MB';
    }
    size = (size / 1024).toFixed(2);
    if (size < 1024) {
        return size + 'GB';
    }
    size = (size / 1024).toFixed(2);
    return size + 'PB';
}

function str_format(s, args) {
    var ss = s.split('%s');
    if (ss.length != args.length + 1) {
        throw new Error("Can not format " + s);
    }
    var ns = ss[0];
    for (var i = 1; i < ss.length; i++) {
        ns += args[i - 1];
        ns += ss[i];
    }
    return ns;
}

function str_trim(s, c) {
    if (c == null) {
        c = '/';
    }
    if (s[s.length - 1] == c) {
        return s.substring(0, s.length - 1);
    }
    return s;
}

function str_add_suffix(s, c) {
    if (c == null) {
        c = '/';
    }
    if (s[s.length - 1] != c) {
        return s + c;
    }
    return s;
}

function dict_copy(d) {
    var n = {};
    for (var key in d) {
        n[key] = d[key];
    }
    return d;
}

function path_split(path) {
    var p_path = str_trim(path);
    var p_index = p_path.lastIndexOf('/');
    if (p_index < 0) {
        return {};
    }
    var p_dir = p_path.substring(0, p_index);
    var name = p_path.substring(p_index + 1);
    return {
        'top_dir': p_dir,
        'name': name
    };
}

function path_split2(path) {
    var item = path_split(path);
    if ('top_dir' in item) {
        item['top_dir'] = str_add_suffix(item.top_dir);
    }
    return item;
}

function path_join(dir_name, name) {
    return str_trim(dir_name) + '/' + name;
}

function path_extension(path){
  var extension = path.substring(path.lastIndexOf('.') + 1);
  return extension;
}

function weight_split(t_score, weights) {
    // t_score 输入总权分值
    // weights 权重列表
    var t_weight = 0;
    var l = weights.length;
    for (var i = 0; i < l; i++) {
        t_weight += weights[i];
    }
    var c_score = 0;
    var scores = [];
    for (var j = 0; j < l - 1; j++) {
        var v = Math.round(t_score * weights[j] / t_weight);
        scores.push(v)
        c_score += v;
    }
    var lv = t_score - c_score;
    if (lv >= 0) {
        scores.push(lv);
        return scores;
    }
    scores.push(0);
    var n_scores = []
    for (var k = 0; k < l; k++) {
        if (lv < 0 && scores[k] > 0) {
            n_scores.push(scores[k] - 1);
            lv += 1
        } else {
            n_scores.push(scores[k]);
        }
    }
    return n_scores;
}


function shuffle(arr) {
    // 随机排序
    var len = arr.length;
    for (var i = 0; i < len - 1; i++) {
        var idx = Math.floor(Math.random() * (len - i));
        var temp = arr[idx];
        arr[idx] = arr[len - i - 1];
        arr[len - i - 1] = temp;
    }
    return arr;
}
// 存储相关
var optionChar = ["A", "B", "C", "D", "E", "F", "G", "H"];
var globalData = {
    'optionChar': optionChar
}

function getOrSetCacheData(key, value = null) {
    var gKey = "wildzhapp_cache_" + key;
    if (value == null) {
        value = $api.getStorage(gKey);
        if (value == "" || value == undefined) {
            value = null;
        }
        return value;
    }
    $api.setStorage(gKey, value);
    return value
}

function getDefaultExamNo() {
    var _item = getOrSetDefaultExam(null);
    if (_item == null) {
        return null;
    }
    if ('exam_no' in _item) {
        return _item['exam_no'];
    }
    return null;
}

function setDefaultExam(examItem) {
    getOrSetDefaultExam(examItem);
}

function getOrSetDefaultExam(examItem = null) {
    var _item = getOrSetCacheData('exam.default', examItem);
    if (_item == null) {
        return null;
    } else {
        globalData.defaultExamNo = _item['exam_no'];
        globalData.defaultExamName = _item["exam_name"];
        return _item;
    }
}

function getOrSetCurrentUserData(value = null) {
    return getOrSetCacheData('user.token', value);
}


function getOrSetExamCacheData(key, value = null) {
    if (globalData.defaultExamNo == null) {
        return null;
    }
    var gKey = globalData.defaultExamNo + "_" + key;
    return getOrSetCacheData(gKey, value);
}

function clearCache() {
    $api.rmStorage('wildzhapp_cache_exam.default');
    $api.rmStorage('wildzhapp_cache_user.token');
}
// 页面默认是事件
