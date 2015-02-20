
function TFormOnload() {
  var response = $("#TFormIframe").contents().find("body").text();
  if(response) {
    var jsonResponse = jQuery.parseJSON(response);
    $("#TForm-errors").empty();
    if(jsonResponse) $("#TForm-errors").append( $("<span>").text(response) );
    else $("#TForm-errors").append( $("<span>").text("OK") );
  }
}
