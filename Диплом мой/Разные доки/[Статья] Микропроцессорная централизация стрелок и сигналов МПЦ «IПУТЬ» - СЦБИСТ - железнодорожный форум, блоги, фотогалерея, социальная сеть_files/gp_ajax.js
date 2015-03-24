function GoodPost(){
} 
GoodPost.prototype.removegp=function(pid,tid)
{
	YAHOO.util.Connect.asyncRequest("POST", "good_post.php?do=removegp", 
    {
        success : function (e)
        {
			if(fetch_object("gp"+pid)!==null)
			{
				fetch_object("gp"+pid).innerHTML='';
			}
			var z = fetch_object("gpl_"+pid);
						if (z !== null) {
							z.innerHTML ='<a href="good_post.php?do=addgp&t='+tid+'&p='+pid+'" target="_blank" onclick="CMGP.showform('+pid+','+tid+',1);return false;"><img src="/images/misc/goodpost1.png" border="0"></a>';
						}
		}
	},
    SESSIONURL + "securitytoken=" + SECURITYTOKEN + "&p=" + pid+"&ajaxit=1")
};
GoodPost.prototype.addgp=function(pid,tid)
{
	var desc=fetch_object('gp_desc');
	if(desc!=null)
	{
		desc=desc.value;
	}else
	{
		desc='';
	}
	 if(parseInt(pid)>0 && parseInt(tid)>0 )
	 {
		 YAHOO.util.Connect.asyncRequest("POST", "good_post.php?do=addgp", 
		{
			success : function (e)
			{
				var err = e.responseXML.getElementsByTagName('err')[0].firstChild.nodeValue;
			if(err=='no')
			{
				var c = e.responseXML.getElementsByTagName('res');
				if (c.length && c[0].firstChild && c[0].firstChild.nodeValue != "")
					{
						var b = fetch_object("gp2");
						if (b !== null) {
							b.innerHTML = c[0].firstChild.nodeValue+b.innerHTML;
						}
						var z = fetch_object("gpl_"+pid);
						if (z !== null) {
							z.innerHTML ='';
						}
					}
						var d = fetch_object("cmgpform");
						if (d !== null) {
							d.parentNode.removeChild(d);
						}
			}
			else
			{
					var d = fetch_object("cmgpform");
						if (d !== null) {
							d.parentNode.removeChild(d);
						}
				alert(err);
			}
				
			}
		},SESSIONURL + "securitytoken=" + SECURITYTOKEN + "&p=" + pid+ "&t=" + tid+ "&gp_desc=" + PHP.urlencode(desc)+"&ajaxit=1")
	 }else
	{
			var d = fetch_object("cmgpform");
						if (d !== null) {
							d.parentNode.removeChild(d);
						}
	}
};
GoodPost.prototype.editgp=function(pid,tid)
{
	var desc=fetch_object('gp_desc');
	if(desc!=null)
	{
		desc=desc.value;
	}else
	{
		desc='';
	}
	 if(parseInt(pid)>0 && parseInt(tid)>0)
	 {
		 YAHOO.util.Connect.asyncRequest("POST", "good_post.php?do=editgp", 
		{
			success : function (e)
			{
				var err = e.responseXML.getElementsByTagName('err')[0].firstChild.nodeValue;
			if(err=='no')
			{
				var c = e.responseXML.getElementsByTagName('res');
				if (c.length && c[0].firstChild && c[0].firstChild.nodeValue != "")
					{
						var b = fetch_object("gp"+pid);
						if (b !== null) {
							b.innerHTML = c[0].firstChild.nodeValue;
						}
					}
						var d = fetch_object("cmgpform");
						if (d !== null) {
							d.parentNode.removeChild(d);
						}
			}
			else
			{
					var d = fetch_object("cmgpform");
						if (d !== null) {
							d.parentNode.removeChild(d);
						}
				alert(err);
			}
			}
		},SESSIONURL + "securitytoken=" + SECURITYTOKEN + "&p=" + pid+ "&t=" + tid+ "&gp_desc=" + PHP.urlencode(desc)+"&ajaxit=1")
	 }else
	{
			var d = fetch_object("cmgpform");
						if (d !== null) {
							d.parentNode.removeChild(d);
						}
	}
};
GoodPost.prototype.showform=function(pid,tid,ed)
{
	 if(parseInt(pid)>0 && parseInt(tid)>0 && parseInt(ed)>0)
	 {
		 YAHOO.util.Connect.asyncRequest("POST", "good_post.php?do=showform", 
    {
        success : function (e)
        {
			 var err = e.responseXML.getElementsByTagName('err')[0].firstChild.nodeValue;
			if(err=='no')
			{
				var c = e.responseXML.getElementsByTagName('res');
				if (c.length && c[0].firstChild && c[0].firstChild.nodeValue != "")
					{
						var d = fetch_object("cmgpform");
						if (d !== null) {
							d.parentNode.removeChild(d)
						}
						else
						{
							var b = document.createElement("div");
							b.id = "cmgpform";
							b.style.width = "640px";
							b.style.position = "absolute";
							b.style.zIndex = "100";
							b.innerHTML = c[0].firstChild.nodeValue;
							document.body.appendChild(b);
							center_element(b)
						}
					}
			}else
			{
				alert(err);
			}
		}
	},
    SESSIONURL + "securitytoken=" + SECURITYTOKEN + "&p="+pid+"&t="+ tid+"&e="+ed+"&ajaxit=1")
	 }
};
