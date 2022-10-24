function init_menu()
{
  nav4.bindClick(document.getElementById("nav4_ul").querySelectorAll("li>a"), document.getElementById("nav4_masklayer"));
}

var nav4 = (function() {
    bindClick = function(els, mask) {
        if (!els || !els.length) {
            return;
        }
        var isMobile = "ontouchstart" in window;
        for (var i = 0, ci; ci = els[i]; i++) {
            // 已经注册不再注册
            if(ci.onclick != null){
              continue;
            }
            ci.addEventListener("click", evtFn, false);
        }

        function evtFn(evt, ci) {
            var isShow = false;
            ci = this;
            for (var j = 0, cj; cj = els[j]; j++) {
                if (cj != ci) {
                    cj.classList.remove("on");
                }
            }
            if (ci == mask) {
                UIListView.show();
                mask.classList.remove("on");
                return;
            }
            switch (evt.type) {
                case "click":
                    var on = ci.classList.toggle("on");
                    if(on){
                      isShow = true;
                    }
                    mask.classList[on ?
                        "add" : "remove"]("on");
                    break;
            }
            if(isShow){
              hide_list();
            }
            else{
              UIListView.show();
            }
        }
        mask.addEventListener(isMobile ? "touchstart" : "click", evtFn, false);
    }
    return {
        "bindClick": bindClick
    };
})();

function hide_menu(){
  var els = document.getElementById("nav4_ul").querySelectorAll("li>a");
  for (var j = 0, cj; cj = els[j]; j++) {
      cj.classList.remove("on");
  }

  document.getElementById("nav4_masklayer").classList.remove("on");
  UIListView.show();
}
