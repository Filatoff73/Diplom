/********************************************************************************************/
/* AHAH functions by Phil Ballard                                                           */
/* This code is intended for study purposes.                                                */
/* You may use these functions as you wish, for commercial or non-commercial applications,  */
/* but please note that the author offers no guarantees to their usefulness, suitability or */
/* correctness, and accepts no liability for any losses caused by their use.                */
/********************************************************************************************/

function callAHAH(url, pageElement, callMessage, errorMessage) {
     document.getElementById(pageElement).innerHTML = callMessage;
     try {
     req = new XMLHttpRequest(); /* e.g. Firefox */
     } catch(e) {
       try {
       req = new ActiveXObject("Msxml2.XMLHTTP");  /* some versions IE */
       } catch (e) {
         try {
         req = new ActiveXObject("Microsoft.XMLHTTP");  /* some versions IE */
         } catch (E) {
          req = false;
         } 
       } 
     }
     req.onreadystatechange = function() {responseAHAH(pageElement, errorMessage);};
     req.open("GET",url,true);
     req.send(null);
  }

function responseAHAH(pageElement, errorMessage) {
   var output = '';
   if(req.readyState == 4) {
      if(req.status == 200) {
         output = req.responseText;
         document.getElementById(pageElement).innerHTML = output;
         } else {
         document.getElementById(pageElement).innerHTML = errorMessage+"\n"+output;
         }
      }
  }
