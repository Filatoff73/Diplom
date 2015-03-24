function AJAX_PostComment(max, min){
    this.max = max;
    this.min = min;
}

AJAX_PostComment.prototype.post = function(postid, threadid){
    var message = fetch_object('pmessage_' + postid).value;
    if (message.length < this.min) {
        alert(vbphrase['chang_tooshort']);
    }
    else 
        if (message.length > this.max) {
            alert(vbphrase['chang_toolong'] + message.length);
        }
        else {
            fetch_object('comment_progress_' + postid).innerHTML = vbphrase['chang_posting'];
            YAHOO.util.Connect.asyncRequest('POST', 'post_comment.php?do=post_comment', {
                success: function(o){
                    if (o.responseXML) {
                        var comms = fetch_object('comment_' + postid);
                        comms.parentNode.style.display = 'block';
                        comms.style.display = 'inline';
                        comms.innerHTML = o.responseXML.getElementsByTagName('setcomm')[0].firstChild.nodeValue;
                        fetch_object('pmessage_' + postid).value = '';
                        fetch_object('comment_progress_' + postid).innerHTML = '';
                    }
                },
                failure: vBulletin_AJAX_Error_Handler,
                timeout: vB_Default_Timeout,
                scope: this
            }, SESSIONURL + "securitytoken=" + SECURITYTOKEN + "&do=post_comment&postid=" + postid + "&threadid=" + threadid + "&message=" + PHP.urlencode(message));
        }
};

AJAX_PostComment.prototype.get = function(postid, page){
    fetch_object('comment_progress_' + postid).innerHTML = vbphrase['chang_getting'];
    YAHOO.util.Connect.asyncRequest('POST', 'post_comment.php?do=get_comment', {
        success: function(o){
            if (o.responseXML) {
                var comms = fetch_object('comment_' + postid);
                comms.parentNode.style.display = 'block';
                comms.style.display = 'inline';
                comms.innerHTML = o.responseXML.getElementsByTagName('getcomm')[0].firstChild.nodeValue;
                fetch_object('comment_progress_' + postid).innerHTML = '';
            }
        },
        failure: vBulletin_AJAX_Error_Handler,
        timeout: vB_Default_Timeout,
        scope: this
    }, SESSIONURL + "securitytoken=" + SECURITYTOKEN + "&do=get_comment&postid=" + postid + "&page=" + page);
};

AJAX_PostComment.prototype.del = function(commentid, postid){
    if (confirm(vbphrase['chang_sure_del'])) {
        YAHOO.util.Connect.asyncRequest('POST', 'post_comment.php?do=del_comment', {
            success: function(o){
                if (o.responseText !== undefined) {
                    var row = fetch_object('commentbit_' + commentid);
                    row.parentNode.removeChild(row);
                }
            },
            failure: vBulletin_AJAX_Error_Handler,
            timeout: vB_Default_Timeout,
            scope: this
        }, SESSIONURL + "securitytoken=" + SECURITYTOKEN + "&do=del_comment&commentid=" + commentid + "&postid=" + postid);
    }
};

AJAX_PostComment.prototype.sh = function(ma){
    var form = fetch_object('comment_' + ma).parentNode;
    form.style.display = (form.style.display == 'none') ? 'block' : 'none';
};