
function regFormOnload() {
  var response = $("#regFormIframe").contents().find("body").text();
  $("#response").text(response);
}
