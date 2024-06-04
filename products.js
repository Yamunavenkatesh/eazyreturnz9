document.getElementById("uploadForm").addEventListener("submit", function(event) {
    event.preventDefault();
  
    var form = document.getElementById("uploadForm");
    var formData = new FormData(form);
  
    navigator.geolocation.getCurrentPosition(function(position) {
      formData.append("location", `${position.coords.latitude},${position.coords.longitude}`);
  
      fetch("http://localhost:3000/upload", {
        method: "POST",
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.message) {
          alert("Product Added");
          document.getElementById("message").innerText = data.message;
        } else {
          throw new Error("Failed to upload");
        }
      })
      .catch(error => {
        console.error("Error:", error);
        document.getElementById("message").innerText = "Failed to add product.";
      });
    }, function(error) {
      console.error("Geolocation error:", error);
      document.getElementById("message").innerText = "Failed to get location.";
    });
  });
  
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        document.getElementById("location").innerText = "Geolocation is not supported by this browser.";
    }
}

function showPosition(position) {
    var latitude = position.coords.latitude;
    var longitude = position.coords.longitude;
    document.getElementById("location").innerText = "Live Location has been stored";
}

function showError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            document.getElementById("location").innerText = "User denied the request for Geolocation.";
            break;
        case error.POSITION_UNAVAILABLE:
            document.getElementById("location").innerText = "Location information is unavailable.";
            break;
        case error.TIMEOUT:
            document.getElementById("location").innerText = "The request to get user location timed out.";
            break;
        case error.UNKNOWN_ERROR:
            document.getElementById("location").innerText = "An unknown error occurred.";
            break;
    }
}


