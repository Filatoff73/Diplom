/************************************************************************\
 *
 * NuWiki v1.3 RC1
 * 
 * Copyright ©2006-2007 NuHit, LLC. All Rights Reserved.
 * This file may not be redistributed in whole or significant part.
 * http://www.nuhit.com | http://www.nuhit.com/license.html
 *
\************************************************************************/


var g_nuwiki_hover_current_id = 0;
var g_nuwiki_hover_timer_id = 0;
var g_nuwiki_preview_visible = false;
var g_nuwiki_preview_obj = null;
var g_nuwiki_hover_anchor_obj = null;
var g_nuwiki_hover_anchor_pos = null;
var g_nuwiki_article_data = new Object();

function nuwiki_init()
{
	if (g_nuwiki_preview_enabled)		// then previews are enabled.
	{
		var myrules = {
			'.nuwiki_autolink' : function(element) { 
									element.onmouseover	= nuwiki_autolink_onmouseover;
									element.onmouseout	= nuwiki_autolink_onmouseout;
								}
		};
		Behaviour.register(myrules);
		Behaviour.apply();
	}
}

function nuwiki_autolink_onmouseover()
{
	var nuwiki_id_attr = this.attributes['nuwiki_id'];
	if (nuwiki_id_attr == undefined)
		return false;

	var nuwiki_id = nuwiki_id_attr.value;
	if (nuwiki_id == undefined)
		return;
	
	if (nuwiki_id == g_nuwiki_hover_current_id)
		return;		// hovering over the same element, nothing to do.

	if (g_nuwiki_hover_timer_id)
		clearTimeout( g_nuwiki_hover_timer_id );
	
	g_nuwiki_hover_current_id = nuwiki_id;
	g_nuwiki_hover_anchor_obj = this;
	g_nuwiki_hover_anchor_pos = nuwiki_fetch_position( this, null );
	if (g_nuwiki_preview_delay > 0)
		g_nuwiki_hover_timer_id = setTimeout( 'nuwiki_autolink_show_preview()', g_nuwiki_preview_delay * 1000 );
	else
		nuwiki_autolink_show_preview();
	return false;
}

function nuwiki_autolink_onmouseout()
{
	if (g_nuwiki_hover_timer_id)
	{
		clearTimeout( g_nuwiki_hover_timer_id );
		g_nuwiki_hover_timer_id = 0;
	}
	
	if (g_nuwiki_preview_visible && g_nuwiki_preview_obj)
	{
		g_nuwiki_hover_timer_id = setTimeout( 'nuwiki_autolink_hide_preview()', 500 );
	}
	else
		g_nuwiki_hover_current_id = 0;
}

function nuwiki_autolink_preview_mouseover()
{
	if (g_nuwiki_hover_timer_id)
	{
		clearTimeout( g_nuwiki_hover_timer_id );
		g_nuwiki_hover_timer_id = 0;
	}
}

function nuwiki_autolink_preview_mouseout()
{
	if (g_nuwiki_hover_timer_id)
	{
		clearTimeout( g_nuwiki_hover_timer_id );
		g_nuwiki_hover_timer_id = 0;
	}
		
	g_nuwiki_hover_timer_id = setTimeout( 'nuwiki_autolink_hide_preview()', 500 );
}

function nuwiki_autolink_hide_preview()
{
	g_nuwiki_hover_current_id = 0;
	if (g_nuwiki_preview_visible && g_nuwiki_preview_obj)
	{
		g_nuwiki_preview_obj.style.display = 'none';		// hide it.
		g_nuwiki_preview_visible = false;
	}
}

function nuwiki_autolink_show_preview()
{
	if (g_nuwiki_article_data[ g_nuwiki_hover_current_id ] != undefined)
	{
		nuwiki_autolink_show_preview2( g_nuwiki_article_data[ g_nuwiki_hover_current_id ] );
	}
	else
	{
		nuwiki_ajax_handler = new vB_AJAX_Handler(true);
		nuwiki_ajax_handler.onreadystatechange( nuwiki_autolink_ajax_done );
		nuwiki_ajax_handler.send('ajax.php?do=nuwiki_article&t=' + g_nuwiki_hover_current_id, 'do=nuwiki_article&t=' + g_nuwiki_hover_current_id );
	}
}

function nuwiki_autolink_ajax_done()
{
	if (nuwiki_ajax_handler.handler.readyState != 4 || nuwiki_ajax_handler.handler.status != 200)
		return;		// not done yet

	var responseXML = nuwiki_ajax_handler.handler.responseXML;
	if (!responseXML)
		return;

	var article_response = fetch_tags(responseXML, 'article')[0];
	if (!article_response)
		return;
	
	var article_id = article_response.getAttribute('threadid');
	var title = article_response.getAttribute('title');
	var content = nuwiki_ajax_handler.fetch_data( article_response );
	
	var article_data = new Object();
	article_data['article_id']	= article_id;
	article_data['title']		= title;
	article_data['content']		= content;

	g_nuwiki_article_data[ article_id ] = article_data;
	
	nuwiki_autolink_show_preview2( article_data );
}

function nuwiki_autolink_show_preview2( article_data )
{
	if (!article_data)
		return;
	
	var article_id	= article_data.article_id;
	var title		= article_data.title;
	var content		= article_data.content;

	if (article_id != g_nuwiki_hover_current_id)
		return;

	if (!g_nuwiki_preview_obj)
	{
		g_nuwiki_preview_obj = fetch_object( 'nuwiki_preview' );
		if (!g_nuwiki_preview_obj)
		{
			g_nuwiki_preview_obj = document.createElement("div");
			if (!g_nuwiki_preview_obj)
				return;
			document.body.appendChild(g_nuwiki_preview_obj);
		}
		g_nuwiki_preview_obj.onmouseover = nuwiki_autolink_preview_mouseover
		g_nuwiki_preview_obj.onmouseout = nuwiki_autolink_preview_mouseout;
	}
	
	// show preview
	g_nuwiki_preview_obj.className = 'nuwiki_autolink_ctr';
	g_nuwiki_preview_obj.innerHTML = content;
	
	var preview_width		= g_nuwiki_preview_width;
	var preview_height	= g_nuwiki_preview_obj.offsetHeight ? g_nuwiki_preview_obj.offsetHeight : g_nuwiki_preview_height;

	g_nuwiki_preview_obj.style.width	= preview_width + 'px';

	var left	= g_nuwiki_hover_anchor_pos.left + g_nuwiki_hover_anchor_pos.width	+ 5;
	var top		= g_nuwiki_hover_anchor_pos.top  - preview_height			- 5;
	
	var scroll_x = (document.all) ? document.body.scrollLeft : window.pageXOffset;
	var scroll_y = (document.all) ? document.body.scrollTop : window.pageYOffset; 

	if (left < scroll_x)
		left = scroll_x + 10;

	if (top < scroll_y)
		top = scroll_y + 10;

	if ( (left + preview_width) > document.body.clientWidth )
		left = document.body.clientWidth - preview_width;
	
	//if ( (top + preview_height) > document.body.clientHeight )
	//	top = document.body.clientHeight - preview_height;
	
	g_nuwiki_preview_obj.style.left	= left	+ 'px';
	g_nuwiki_preview_obj.style.top	= top	+ 'px';
	//g_nuwiki_preview_obj.style.height	= preview_height + 'px';

	g_nuwiki_preview_obj.style.display = 'block';
	g_nuwiki_preview_visible = true;
}

function nuwiki_fetch_position( obj, parent_obj )
{
	var left = obj.offsetLeft;
	var top = obj.offsetTop;
	var width = obj.offsetWidth;
	var height = obj.offsetHeight;
	
	while (((obj = obj.offsetParent) != null) && (obj != parent_obj))
	{
		left += obj.offsetLeft;
		top += obj.offsetTop;
	}

	return { 'left' : left, 'top' : top, 'width' : width, 'height' : height };
}


