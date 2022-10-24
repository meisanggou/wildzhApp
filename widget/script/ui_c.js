function openSelector(obj, values, col, successFunc) {
    if (obj == null) {
        obj = api.require('UIActionSelector');
    }
    obj.open({
        datas: values,
        layout: {
            row: 5,
            col: col,
            height: 25,
            size: 18,
            sizeActive: 18,
            rowSpacing: 18,
            colSpacing: 10,
            maskBg: 'rgba(0,0,0,0.2)',
            color: '#888',
            colorSelected: 'rgb(0,0,0)'
        },
        selectedBold: false,
        animation: true,
        title: {
            text: '',
        },
    }, function(ret, err) {
        if (ret) {
            if (ret.eventType == 'ok') {
                successFunc(ret.selectedInfo)
            }
        } else {
            alert(JSON.stringify(err));
        }
    });
}
