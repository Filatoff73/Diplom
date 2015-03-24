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

// #############################################################################
// vB_AJAX_TagSuggest
// #############################################################################

/**
* Class to read input and suggest tags from the typed fragment
*
* @package	vBulletin
* @version	$Revision: 24798 $
* @date		$Date: 2007-11-22 13:59:49 +0000 (Thu, 22 Nov 2007) $
* @author	Mike Sullivan, Kier Darby
* @copyright	Jelsoft Enterprises Ltd.
*
* @param	string	Name of variable instantiating this class
* @param	string	ID of the text input element to monitor
* @param	string	Unique key of the popup menu in which to show suggestions
*/
function vB_AJAX_TagSuggest(varname, textobjid, menukey)
{
	var webkit_version = userAgent.match(/applewebkit\/([0-9]+)/);

	if (AJAX_Compatible && !(is_saf && !(webkit_version[1] >= 412)))
	{
		this.menuobj = fetch_object(menukey + '_menu');
		this.textobj = fetch_object(textobjid);
		this.textobj.setAttribute("autocomplete", "off");
		this.textobj.onfocus = function(e) { this.obj.active = true; };
		this.textobj.onblur  = function(e) { this.obj.active = false; };
		this.textobj.obj = this;

		/**
		* Varaiables used by this class
		*
		* @var	string	The name given to the instance of this class
		* @var	string	The menu key for the vbmenu name suggestion popup
		* @var	string	The current tag fragment text
		* @var	string	The current string of completed tags (Foo ; Bar etc.)
		* @var	array	A list of delimiters for tags
		* @var	integer	The currently selected tag index in the menu
		* @var	boolean	Is the suggestion menu open or not
		* @var	object	A javascript timeout marker
		* @var	array	The list of suggested tags
		* @var	boolean	True when text box is focussed - only show menu when true
		* @var	object	YUI AJAX Transaction
		*/
		this.varname = varname;
		this.menukey = menukey;
		this.fragment = '';
		this.donetags = '';
		this.delimiters = new Array(',');
		this.selected = 0;
		this.menuopen = false;
		this.timeout = null;
		this.tags = new Array();
		this.active = false;
		this.ajax_req = null;

		/**
		* Options used by this class
		*
		* @var	boolean	Allow multiple tags (Foo, Bar etc.) or just single (Foo)
		* @var	integer	The minimum length of the text fragment before requesting a search
		*/
		this.allow_multiple = false;
		this.min_chars = 3;

		// =============================================================================
		// vB_AJAX_TagSuggest methods

		/**
		* Sets additional delimiters for separating multiple tags. A comma will always be used.
		*
		* @param	string	List of delimiters
		*/
		this.set_delimiters = function(delimiters)
		{
			this.delimiters = new Array(',');

			if (delimiters)
			{
				var delim_matches, i;

				// find all {...} parts first. Parse them and then remove.
				if (delim_matches = PHP.match_all(delimiters, '\{([^}]*)\}'))
				{
					for (i = 0; i < delim_matches.length; i++)
					{
						if (delim_matches[i][1] !== '')
						{
							this.delimiters.push(delim_matches[i][1]);
						}

						delimiters = delimiters.replace(delim_matches[i][0], '');
					}
				}

				// remaining text is just space delimited
				delim_matches = delimiters.split(' ');
				for (i = 0; i < delim_matches.length; i++)
				{
					if (delim_matches[i] !== '')
					{
						this.delimiters.push(delim_matches[i]);
					}
				}
			}
		}

		/**
		* Reads the contents of the text input box
		*/
		this.get_text = function()
		{
			if (this.allow_multiple)
			{
				// search for a delimiter (meaning we have more than one tag in the box)
				var delimpos = -1, delimlen;
				for (var delimid = 0; delimid < this.delimiters.length; delimid++)
				{
					if (this.textobj.value.lastIndexOf(this.delimiters[delimid]) > delimpos)
					{
						delimpos = this.textobj.value.lastIndexOf(this.delimiters[delimid]);
						delimlen = this.delimiters[delimid].length;
					}
				}

				if (delimpos == -1)
				{
					// the current tag is the only one in the text box
					this.donetags = new String('');
					this.fragment = new String(this.textobj.value);
				}
				else
				{
					// also need to store completed tags in the text box
					this.donetags = new String(this.textobj.value.substring(0, delimpos + delimlen));
					this.fragment = new String(this.textobj.value.substring(delimpos + delimlen));
				}
			}
			else
			{
				this.fragment = new String(this.textobj.value);
			}

			// trim away leading and trailing spaces from the fragment
			this.fragment = PHP.trim(this.fragment);
		}

		/**
		* Sets the contents of the text input box
		*
		* @param	integer	The index of the desired tag in this.tags to insert
		*/
		this.set_text = function(i)
		{
			if (this.allow_multiple)
			{
				var extra_space = (this.donetags.substr(this.donetags.length - 1) == " " ? "" : " ");
				this.textobj.value = PHP.ltrim(this.donetags + extra_space + PHP.unhtmlspecialchars(this.tags[i]) + ", ");
			}
			else
			{
				this.textobj.value = PHP.unhtmlspecialchars(this.tags[i]);
			}

			this.textobj.focus();

			this.menu_hide();

			return false;
		}

		/**
		* Moves the 'selected' row in the menu
		*
		* @param	integer	Increment (1, -1 etc.)
		*/
		this.move_row_selection = function(increment)
		{
			var newval = parseInt(this.selected, 10) + parseInt(increment, 10);

			if (newval < 0)
			{
				newval = this.tags.length - 1;
			}
			else if (newval >= this.tags.length)
			{
				newval = 0;
			}

			this.set_row_selection(newval);

			return false;
		}

		/**
		* Sets the 'selected' row in the menu
		*
		* @param	integer	The index of the desired selection (0 - n)
		*/
		this.set_row_selection = function(i)
		{
			var tds = fetch_tags(this.menuobj, 'td');
			tds[this.selected].className = 'vbmenu_option';
			this.selected = i;
			tds[this.selected].className = 'vbmenu_hilite';
		}

		/**
		* Event handler for the text input box key-up event
		*
		* @param	event	The event object
		*/
		this.key_event_handler = function(evt)
		{
			evt = evt ? evt : window.event;

			if (this.menuopen)
			{
				// 38 = up
				// 40 = down
				// 13 = return
				// 27 = escape

				switch (evt.keyCode)
				{
					case 38: // arrow up
					{
						this.move_row_selection(-1);
						return false;
					}
					case 40: // arrow down
					{
						this.move_row_selection(1);
						return false;
					}
					case 27: // escape
					{
						this.menu_hide();
						return false;
					}
					case 13: // return / enter
					{
						this.set_text(this.selected);
						return false;
					}
				}
			}

			// create the fragment
			this.get_text();

			if (this.fragment.length >= this.min_chars)
			{
				clearTimeout(this.timeout);
				this.timeout = setTimeout(this.varname + '.tag_search();', 500);
			}
			else
			{
				this.menu_hide();
			}
		}

		/**
		* Sends the fragment to search the database
		*/
		this.tag_search = function()
		{
			if (this.active)
			{
				this.tags = new Array();

				this.ajax_req = YAHOO.util.Connect.asyncRequest("POST", "ajax.php?do=tagsearch", {
					success: this.handle_ajax_response,
					failure: vBulletin_AJAX_Error_Handler,
					timeout: vB_Default_Timeout,
					scope: this
				}, SESSIONURL + "securitytoken=" + SECURITYTOKEN + "&do=tagsearch&fragment=" + PHP.urlencode(this.fragment));
			}
		}

		/**
		* Handles AJAX response
		*
		* @param	object	YUI AJAX
		*/
		this.handle_ajax_response = function(ajax)
		{
			if (ajax.responseXML)
			{
				// ensure that the box we're attached to is still visible before showing this menu
				var node = this.textobj;
				do
				{
					if (node.style.display == 'none')
					{
						this.menu_hide();
						return;
					}
				}
				while ((node = node.parentNode) != null && node.style);

				var tags = ajax.responseXML.getElementsByTagName('tag');
				if (tags.length)
				{
					for (var i = 0; i < tags.length; i++)
					{
						this.tags[i] = tags[i].firstChild.nodeValue;
					}
				}

				if (this.tags.length)
				{
					this.menu_build();
					this.menu_show();
				}
				else
				{
					this.menu_hide();
				}
			}
		}

		/**
		* Builds the menu html from the list of found tags
		*/
		this.menu_build = function()
		{
			this.menu_empty();
			var re = new RegExp('^(' + PHP.preg_quote(this.fragment) + ')', "i");

			var table = document.createElement('table');
			table.cellPadding = 4;
			table.cellSpacing = 1;
			table.border = 0;
			for (var i in this.tags)
			{
				if (YAHOO.lang.hasOwnProperty(this.tags, i))
				{
					var td = table.insertRow(-1).insertCell(-1);
					td.className = (i == this.selected ? 'vbmenu_hilite' : 'vbmenu_option');
					td.title = 'nohilite';
					td.innerHTML = '<a onclick="return ' + this.varname + '.set_text(' + i + ')">' + this.tags[i].replace(re, '<strong>$1</strong>') + '</a>';
				}
			}
			this.menuobj.appendChild(table);

			if (this.vbmenu == null)
			{
				if (typeof(vBmenu.menus[this.menukey]) != 'undefined')
				{
					this.vbmenu = vBmenu.menus[this.menukey];
				}
				else
				{
					this.vbmenu = vBmenu.register(this.menukey, true);
				}
			}
			else
			{
				this.vbmenu.init_menu_contents();
			}
		}

		/**
		* Empties the menu of all tags
		*/
		this.menu_empty = function()
		{
			this.selected = 0;

			while (this.menuobj.firstChild)
			{
				this.menuobj.removeChild(this.menuobj.firstChild);
			}
		}

		/**
		* Shows the menu
		*/
		this.menu_show = function()
		{
			if (this.active && fetch_object(this.menukey))
			{
				this.vbmenu.show(fetch_object(this.menukey), this.menuopen);
				this.menuopen = true;
			}
		}

		/**
		* Hides the menu
		*/
		this.menu_hide = function()
		{
			try
			{
				this.vbmenu.hide();
			}
			catch(e) {}
			this.menuopen = false;
		}

		this.textobj.onkeyup = function(e) { return this.obj.key_event_handler(e); };
		this.textobj.onkeypress = function(e)
		{
			e = e ? e : window.event;
			if (e.keyCode == 13)
			{
				return (this.obj.menuopen ? false : true);
			}
		};
	}
	else
	{
		// dummy functions to prevent errors
		this.set_delimiters = function(delimiters) 
		{
		}
	}
}

/*======================================================================*\
|| ####################################################################
|| # NulleD - FintMax
|| # CVS: $RCSfile$ - $Revision: 15547 $
|| ####################################################################
\*======================================================================*/