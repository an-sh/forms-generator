
function TFormOnload() {
  var response = $("#TFormIframe").contents().find("body").text();
  if(response) {
    var jsonResponse = jQuery.parseJSON(response);
    $("#TForm-errors").empty();
    if(jsonResponse) $("#TForm-errors").append( $("<p>").text(response) );
    else $("#TForm-errors").append( $("<p>").text("OK") );
  }
}
