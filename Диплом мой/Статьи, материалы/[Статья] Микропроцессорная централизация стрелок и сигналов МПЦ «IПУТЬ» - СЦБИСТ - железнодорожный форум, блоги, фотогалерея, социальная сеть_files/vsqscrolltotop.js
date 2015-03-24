/**
 * @author mad@Max
 */
YAHOO.util.Event.onDOMReady(function(){
	var Y = YAHOO.util;
	var btn = document.createElement('div');
	with(btn.style)
	{
		width = "51px";
		height = "51px";
		background = "url(images/up1.png) no-repeat scroll 0% 0% transparent";
		position = "fixed";
		bottom = "25px";
		right = "0px";
		cursor = "pointer";
		display = "block";
		opacity = 1;
		filter = "alpha(opacity=100)";
	}
	btn.title = "Наверх";
	document.body.appendChild(btn);
	var hide = new Y.Anim(btn, {opacity: {from: 1, to: 0}}, 0.3), show = new Y.Anim(btn, {opacity: {from: 0, to: 1}}, 0.3);
	
	var scroll = new Y.Scroll(document.getElementsByTagName((YAHOO.env.ua.webkit ? "body" : "html"))[0], {scroll: {to: [0, 0]}}, 0.5); 
	
	
	hide.onComplete.subscribe(function(){btn.style.opacity = 0;});
	show.onComplete.subscribe(function(){btn.style.opacity = 1;});
	scroll.onComplete.subscribe(function(){hide.animate();});
	Y.Event.on(btn, "click", function(){scroll.animate();});
	Y.Event.on(window, "scroll", function(){
		if (Y.Dom.getDocumentScrollTop() > 100) 
		{
			if (btn.style.opacity < 1 && !scroll.isAnimated()) 
			{
				show.animate();
			}
		}
		else 
		{
			if (btn.style.opacity > 0 && !scroll.isAnimated()) 
			{
				hide.animate();
			}
		}
	});
});