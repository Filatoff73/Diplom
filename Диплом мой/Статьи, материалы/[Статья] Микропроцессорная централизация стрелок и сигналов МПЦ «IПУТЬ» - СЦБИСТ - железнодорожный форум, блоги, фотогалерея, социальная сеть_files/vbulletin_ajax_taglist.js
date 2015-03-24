/*!======================================================================*\
|| #################################################################### ||
|| # vBulletin 3.8.1
|| # ---------------------------------------------------------------- # ||
|| # Copyright ©2000-2009 Jelsoft Enterprises Ltd. All Rights Reserved. ||
|| # This file may not be redistributed in whole or significant part. # ||
|| # ---------------- VBULLETIN IS NOT FREE SOFTWARE ---------------- # ||
|| # http://www.vbulletin.com | http://www.vbulletin.com/license.html # ||
|| #################################################################### ||
\*======================================================================*/

var tag_add_comp;

if (fetch_object('tag_edit_link'))
{
	YAHOO.util.Event.on(fetch_object('tag_edit_link'), 'click', tag_edit_click);
}

/**
* Event for clicking the "edit tags" link. Opens a form via AJX if possible.
*/
function tag_edit_click(e)
{
	YAHOO.util.Event.stopEvent(e);

	if (!this.tag_editor)
	{
		this.tag_editor = new vB_AJAX_TagThread('tag_list_cell', this.id);
	}
	this.tag_editor.fetch_form();
}

/**
* Makes a new TagThread object, which can fetch a form to edit tags and update them.
* For use on showthread.
*/
function vB_AJAX_TagThread(tag_container, linkid)
{
	this.edit_form = 'tag_edit_form';
	this.edit_cancel = 'tag_edit_cancel';

	this.form_progress = 'tag_form_progress';
	this.submit_progress = 'tag_edit_progress';

	this.form_visible = false;
	this.do_ajax_submit = true;

	this.tag_container = tag_container;

	var match = fetch_object(linkid).href.match(/(\?|&)t=([0-9]+)/);
	this.threadid = match[2];
}

/**
* Attempts to fetch the tag editing form via AJAX.
*/
vB_AJAX_TagThread.prototype.fetch_form = function()
{
	if (!this.form_visible)
	{
		YAHOO.util.Connect.asyncRequest("POST", "threadtag.php?t=" + this.threadid, {
			success: this.handle_ajax_form,
			failure: this.handle_ajax_form_error,
			timeout: vB_Default_Timeout,
			scope: this
		}, SESSIONURL + "securitytoken=" + SECURITYTOKEN + "&t=" + this.threadid + "&ajax=1");

		if (fetch_object(this.form_progress))
		{
			fetch_object(this.form_progress).style.display = '';
		}


	}
}

/**
* Handles the AJAX response for the form.
*/
vB_AJAX_TagThread.prototype.handle_ajax_form = function(ajax)
{
	if (ajax.responseXML && !this.form_visible)
	{
		// check for error first
		var error = ajax.responseXML.getElementsByTagName('error');
		if (error.length)
		{
			alert(error[0].firstChild.nodeValue);
		}
		else if (ajax.responseXML.getElementsByTagName('html')[0])
		{
			var container = fetch_object(this.tag_container);
			container.origInnerHTML = container.innerHTML;
			container.innerHTML = ajax.responseXML.getElementsByTagName('html')[0].firstChild.nodeValue;

			// now we need to setup the JS
			YAHOO.util.Event.on(this.edit_form, 'submit', this.submit_tag_edit, this, true);
			YAHOO.util.Event.on(this.edit_cancel, 'click', this.cancel_tag_edit, this, true);

			if (fetch_object('tag_add_wrapper_menu') && fetch_object('tag_add_input'))
			{
				vbmenu_register('tag_add_wrapper', true);
				tag_add_comp = new vB_AJAX_TagSuggest('tag_add_comp', 'tag_add_input', 'tag_add_wrapper');
				tag_add_comp.allow_multiple = true;

				var delimiters = ajax.responseXML.getElementsByTagName('delimiters')[0];
				if (delimiters && delimiters.firstChild)
				{
					tag_add_comp.set_delimiters(delimiters.firstChild.nodeValue);
				}

				// see #25376
				fetch_object("tag_add_input").focus();
				fetch_object("tag_add_input").focus();
			}

			this.form_visible = true;
		}
	}

	if (fetch_object(this.form_progress))
	{
		fetch_object(this.form_progress).style.display = 'none';
	}
}

/**
* Handles an error with the AJAX call to display the form.
*/
vB_AJAX_TagThread.prototype.handle_ajax_form_error = function(ajax)
{
	vBulletin_AJAX_Error_Handler(ajax);
	window.location = "threadtag.php?" + SESSIONURL + "t=" + this.threadid;
}

/**
* Submits the returned form via AJAX to actually update tags.
*/
vB_AJAX_TagThread.prototype.submit_tag_edit = function(e)
{
	if (this.do_ajax_submit)
	{
		YAHOO.util.Event.stopEvent(e);

		var hidden_form = new vB_Hidden_Form(null);
		hidden_form.add_variables_from_object(fetch_object(this.edit_form));

		YAHOO.util.Connect.asyncRequest("POST", "threadtag.php?do=managetags&t=" + this.threadid, {
			success: this.handle_ajax_submit,
			failure: this.handle_ajax_submit_error,
			timeout: vB_Default_Timeout,
			scope: this
		}, SESSIONURL + 'securitytoken=' + SECURITYTOKEN + "&do=managetags&ajax=1&" + hidden_form.build_query_string());

		if (fetch_object(this.submit_progress))
		{
			fetch_object(this.submit_progress).style.display = '';
		}
	}
}

/**
* Handles the AJAX response to submitting the tag form.
*/
vB_AJAX_TagThread.prototype.handle_ajax_submit = function(ajax)
{
	if (ajax.responseXML)
	{
		// check for error first
		var error = ajax.responseXML.getElementsByTagName('error');
		if (error.length)
		{
			alert(error[0].firstChild.nodeValue);
		}
		else
		{
			var taghtml = ajax.responseXML.getElementsByTagName('taghtml');
			if (taghtml.length && taghtml[0].firstChild && taghtml[0].firstChild.nodeValue !== '')
			{
				// this should only happen if they didn't add any tags, and we want to leave the "none" option
				fetch_object(this.tag_container).innerHTML = taghtml[0].firstChild.nodeValue;
			}

			var warning = ajax.responseXML.getElementsByTagName('warning');
			if (warning.length && warning[0].firstChild)
			{
				alert(warning[0].firstChild.nodeValue);
			}

			this.form_visible = false;
		}
	}

	if (fetch_object(this.submit_progress))
	{
		fetch_object(this.submit_progress).style.display = 'none';
	}
}

/**
* Handles an error in the AJAX submission of form contents.
*/
vB_AJAX_TagThread.prototype.handle_ajax_submit_error = function(ajax)
{
	vBulletin_AJAX_Error_Handler(ajax);
	this.do_ajax_submit = false;

	fetch_object(this.edit_form).submit();
}

/**
* Cancels editing and returns to the original tag list.
*/
vB_AJAX_TagThread.prototype.cancel_tag_edit = function()
{
	var container = fetch_object(this.tag_container);
	if (container.origInnerHTML)
	{
		container.innerHTML = container.origInnerHTML;
		container.origInnerHTML = '';
	}

	if (fetch_object(this.form_progress))
	{
		fetch_object(this.form_progress).style.display = 'none';
	}

	this.form_visible = false;
}

/*======================================================================*\
|| ####################################################################
|| # NulleD - FintMax
|| # CVS: $RCSfile$ - $Revision: 17649 $
|| ####################################################################
\*======================================================================*/