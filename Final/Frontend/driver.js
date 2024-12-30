// Modal Elements
const modal = document.getElementById("messageModal");
const messageText = document.getElementById("messageText");
const closeModalButton = document.getElementById("closeMessageModal");
function showMessage(message) {
    messageText.textContent = message;
    modal.style.display = "flex";
    modal.style.visibility = "visible";
}
closeModalButton.addEventListener('click', () => {
    modal.style.display = "none";
});
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = "none";
    }
});

function toggleLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.style.display = logoutBtn.style.display === 'block' ? 'none' : 'block';
}

function logout() {
    sessionStorage.removeItem('token');
    window.location.href = 'login copy.html';
}

// Function to show selected section
function showSection(sectionId) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.style.display = 'none');
    document.getElementById(sectionId).style.display = 'block';

    const links = document.querySelectorAll('.sidebar nav ul li a');
    links.forEach(link => link.classList.remove('active'));

    // Add the active class to the clicked link
    const activeLink = document.querySelector(`a[href="#"][onclick*="showSection('${sectionId}')"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

let users = null;

let driverId = null;
async function fetchUserSession() {
    try {
        const token = sessionStorage.getItem('token');
        if (!token) {
            document.getElementById('user-info').innerHTML = '<p>No user logged in.</p>';
            return;
        }
        const response = await fetch('https://saber-windy-nape.glitch.me/auth/get-session-user', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user session.');
        }
        const data = await response.json();
        if (data.username) {
            document.getElementById('user-info').innerHTML = `
               <p><strong>Welcome </strong> ${data.username}</p>
               ${data.email ? `<p><strong>Email:</strong> ${data.email}</p>` : ''}
               <button class="logout-btn" onclick="logout()">Logout</button>
           `;
            const username = data.username;
            const userId = await getUserId(username);
            driverId = userId;
            if (userId) {
                const approvalStatus = await getApprovalStatus(userId);
                if (approvalStatus === 'pending') {
                    disableControls();
                    showMessage('Your account is pending approval. Please wait for admin approval.');
                } else if (approvalStatus === 'approved') {
                    enableControls();
                    await fetchPassengerCount(userId);
                    await fetchRideCount(userId);
                    await fetchRideStatus(userId);
                    await fetchfare(userId);
                    await checkDriverRegistrationStatus();
                    websession();
                }
            }
        } else {
            showMessage("User not found.");
            window.location.href = 'login copy.html';
        }
    } catch (error) {
        showMessage('Error fetching user session:');
        window.location.href = 'login copy.html';
    }
}

async function getUserId(username) {
    try {
        const response = await fetch(`https://saber-windy-nape.glitch.me/auth/get-driver-id/${encodeURIComponent(username)}`);

        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        if (data.driver_id) {
            sessionStorage.setItem('driver_id', data.driver_id); // Store as driver_id for clarity
            return data.driver_id;
        } else {
            showMessage('Driver not found');
            return null;
        }
    } catch (error) {
        showMessage(`Error fetching driver ID: ${error.message}`);
        return null;
    }
}

async function getApprovalStatus(userId) {
    try {
        const response = await fetch(`https://saber-windy-nape.glitch.me/driver/check-approval`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ driver_id: userId }),
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        return data.registration_status; 
    } catch (error) {
        showMessage(`Error fetching approval status: ${error.message}`);
        return null;
    }
}


function disableControls() {
    const sections = document.querySelectorAll('.content-section, .regi-vehcile, .sidebar nav ul li a');
    sections.forEach(section => section.style.pointerEvents = 'none');
    sections.forEach(section => section.style.opacity = '0.5');
}

function enableControls() {
    const sections = document.querySelectorAll('.content-section, .regi-vehcile, .sidebar nav ul li a');
    sections.forEach(section => section.style.pointerEvents = 'auto');
    sections.forEach(section => section.style.opacity = '1');
}

async function fetchPassengerCount(driverId) {
    try {
        const response = await fetch(`https://saber-windy-nape.glitch.me/stats/passenger/${driverId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const passengerCountElement = document.getElementById('passengerCount');
        passengerCountElement.textContent = `${data.passengerCount}`;
    } catch (error) {
        console.error('Error fetching passenger count:', error);
        document.getElementById('passengerCount').textContent = 'Error loading passenger count';
    }
}
async function fetchRideCount(driverId) {
    try {
        const response = await fetch(`https://saber-windy-nape.glitch.me/stats/ride/${driverId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const rideCountElement = document.getElementById('rideCount');
        rideCountElement.textContent = `${data.rideCount}`;
    } catch (error) {
        console.error('Error fetching passenger count:', error);
        document.getElementById('rideCount').textContent = 'Error loading passenger count';
    }
}
async function fetchRideStatus(driverId) {
    try {
       
        const response = await fetch(`https://saber-windy-nape.glitch.me/stats/ride-status/${driverId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const rideCountElement = document.getElementById('ridestatus');
        rideCountElement.textContent = `${data.ridestatus}`;
    } catch (error) {
        console.error('Error fetching passenger count:', error);
        document.getElementById('ridestatus').textContent = 'Error loading passenger count';
    }
}
async function fetchfare(driverId) {
    try {
        const response = await fetch(`https://saber-windy-nape.glitch.me/stats/fare/${driverId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const rideCountElement = document.getElementById('fare');
        rideCountElement.textContent = `${data.fare}`;
    } catch (error) {
        console.error('Error fetching passenger count:', error);
        document.getElementById('fare').textContent = 'Error loading passenger count';
    }
}

async function fetchDriverVehicles() {
    try {
        const response = await fetch(`https://saber-windy-nape.glitch.me/driver/vehicles/${driverId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const vehicles = await response.json();
        const vehicleListElement = document.getElementById('vehicle-list');
        vehicleListElement.innerHTML = ''; 
        if (vehicles.length === 0) {
            vehicleListElement.innerHTML = '<p>No vehicles found for this driver.</p>';
            return;
        }
        const table = document.createElement('table');
        table.className = 'vehicle-table';
        // Table header
        table.innerHTML = `
           <thead>
               <tr>
                   <th>Vehicle ID</th>
                   <th>License Plate</th>
                   <th>Type</th>
                   <th>Status</th>
                   <th>City</th>
                   <th>Location Area</th>
                   <th>Remaining Capacity</th>
                   <th>Actions</th>
               </tr>
           </thead>
           <tbody></tbody>
       `;

        const tableBody = table.querySelector('tbody');
        vehicles.forEach(vehicle => {
            const row = document.createElement('tr');
            row.innerHTML = `
               <td>${vehicle.vehicle_id}</td>
               <td>${vehicle.license_plate}</td>
               <td>${vehicle.type_name} (Capacity: ${vehicle.capacity})</td>
               <td>${vehicle.status}</td>
               <td>${vehicle.city}</td>
               <td class="area-location">Loading...</td>
               <td>${vehicle.remaining_capacity}</td>
               <td>
                   <button class="delete-btn" onclick="deleteVehicle(${vehicle.vehicle_id})">Delete</button>
               </td>
           `;

            tableBody.appendChild(row);
            geocodeLocation(vehicle.city, vehicle.gps_latitude, vehicle.gps_longitude, area => {
                row.querySelector('.area-location').textContent = area;
            });
        });
        vehicleListElement.appendChild(table);
    } catch (error) {
        console.error('Error fetching driver vehicles:', error);
        document.getElementById('vehicle-list').innerHTML = '<p>Error loading vehicles.</p>';
    }
}
function deleteVehicle(vehicleId) {
    fetch(`https://saber-windy-nape.glitch.me/real/delete-vehicle/${vehicleId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.message) {
            showMessage(data.message);
            // Optionally reload or update the UI
            location.reload();
        } else {
            showMessage(data.error || 'An error occurred.');
        }
    })
    .catch((error) => {
        showMessage('Error deleting vehicle:', error);
    });
}

// Geocode location to get area name
function geocodeLocation(city, latitude, longitude, callback) {
    const queryUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
    fetch(queryUrl)
        .then(response => response.json())
        .then(data => {
            if (data && data.address) {
                // Extract area from the geocoding response
                const address = data.address;
                const area = address.neighbourhood || address.suburb || address.village || address.town || address.city || 'Unknown Area';
                callback(area);
            } else {
                callback('Unknown Area');
            }
        })
        .catch(() => {
            callback('Error fetching area');
        });
}
async function checkDriverRegistrationStatus() {
    try {
        const response = await fetch(`https://saber-windy-nape.glitch.me/driver/can-register/${driverId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const { canRegister } = await response.json();
        const registerButton = document.getElementById('register-vehicle-btn');

        if (canRegister) {
            registerButton.disabled = false;
            registerButton.textContent = 'Register a New Vehicle';
            window.location.href = 'registervehicle.html';
        } else {
            registerButton.disabled = true;
            registerButton.textContent = 'You can register only one vehicle at a time';

        }
    } catch (error) {
        showMessage('Error checking driver registration status:', error);
        const registerButton = document.getElementById('register-vehicle-btn');
        registerButton.disabled = true;
        registerButton.textContent = 'Error loading registration status';
    }
}

let map; 
let pickup_latitude, pickup_longitude, dropoff_latitude, dropoff_longitude;
let driverMarker, pickupMarker, dropoffMarker;
document.addEventListener('DOMContentLoaded', () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
        window.location.href = 'logindriver.html';
    } else {
        fetchUserSession();
    }
});
function showCustomConfirm(message, onAccept, onReject) {
    const confirmModal = document.getElementById("custom-confirm");
    const confirmMessage = document.getElementById("confirm-message");
    const acceptButton = document.getElementById("confirm-accept");
    const rejectButton = document.getElementById("confirm-reject");
    confirmMessage.textContent = message;
    confirmModal.classList.remove("hidden");
    acceptButton.onclick = () => {
      confirmModal.classList.add("hidden");
      if (onAccept) onAccept();
    };
  }
function websession() {
    const ws = new WebSocket('wss://saber-windy-nape.glitch.me/');
    // WebSocket open event
    ws.addEventListener('open', () => {
        console.log('Connected to the WebSocket server as a driver');
        ws.send(JSON.stringify({
            type: 'driver',
            driverId: driverId, 
        }));
    });
    console.log(driverId);
    console.log(driverId);
ws.addEventListener('message', (event) => {
    try {
        const data = JSON.parse(event.data);

        if (data.type === 'rideRequest' && data.data.driverId === driverId) {
            pickup_latitude = data.data.pickup_latitude;
            pickup_longitude = data.data.pickup_longitude;
            dropoff_latitude = data.data.dropoff_latitude;
            dropoff_longitude = data.data.dropoff_longitude;

            // Show the modal
            const modal = document.getElementById('ride-request-modal');
            const acceptBtn = document.getElementById('modal-accept-btn');
            const rejectBtn = document.getElementById('modal-reject-btn');
            const msg = document.getElementById('ride-request-msg');
            
            msg.textContent = `New Ride Request: Pickup - ${pickup_latitude}, Destination - ${data.data.passenger_id}.`;
            modal.style.display = 'block';

            // Accept Button Logic
            acceptBtn.onclick = () => {
                modal.style.display = 'none';
                document.getElementById('dashboard').style.display = 'none';
                document.getElementById('passenger-management').style.display = 'block';
                startRideUpdates(data.data.passenger_id, data.data.dropoff_latitude, data.data.dropoff_longitude);

                ws.send(JSON.stringify({
                    type: 'driver',
                    action: 'acceptRide',
                    driverId: driverId,
                    data: {
                        passengerId: data.data.passenger_id,
                        pickup: data.data.pickup,
                        destination: data.data.destination,
                    },
                }));
            };

            // Reject Button Logic
            rejectBtn.onclick = () => {
                modal.style.display = 'none';

                ws.send(JSON.stringify({
                    type: 'driver',
                    action: 'rejectRide',
                    driverId: driverId,
                    data: {
                        passengerId: data.data.passenger_id,
                    },
                }));
                console.log('Ride rejected and response sent to server.');
            };
        }
    } catch (error) {
        console.error('Error processing message:', error.message);
    }
});


    ws.addEventListener('close', () => {
        console.log('Disconnected from the WebSocket server');
    });

    // WebSocket error event
    ws.addEventListener('error', (error) => {
        console.error('WebSocket error:', error.message);
    });
    let locationUpdateInterval; 
    function startRideUpdates(passengerId, dropoffLatitude, dropoffLongitude) {
       showMessage("Starting ride location updates for passenger ");

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const initialLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                initializeMap(initialLocation);
                const rideStartMessage = {
                    type: 'startRide',
                    driverId: driverId,
                    passengerId: passengerId,
                    location: initialLocation,
                    role: 'driver',
                };
                ws.send(JSON.stringify(rideStartMessage));
                locationUpdateInterval = setInterval(() => {
                    sendLocationUpdate(passengerId, dropoffLatitude, dropoffLongitude);
                }, 5000);
            }, handleError);
        } else {
            console.error('Geolocation is not supported by this browser.');
            alert('Geolocation is not supported by this browser.');
        }
    }
    function sendLocationUpdate(passengerId, dropoffLatitude, dropoffLongitude) {
        console.log("Sending location update for passenger ID:", passengerId);

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const currentLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                updateDriverMarker(currentLocation);
               
                driverMarker = L.marker([currentLocation.lat, currentLocation.lng]).addTo(map);
                driverMarker.bindPopup("You are here").openPopup();
                const threshold = 0.0001; 
                console.log(Math.abs(currentLocation.lat - dropoffLatitude) <= threshold &&
                    Math.abs(currentLocation.lng - dropoffLongitude) <= threshold);
                console.log(Math.abs(currentLocation.lat - dropoffLatitude));
                console.log(Math.abs(currentLocation.lng - dropoffLongitude));
                if (
                    Math.abs(currentLocation.lat - dropoffLatitude) <= threshold &&
                    Math.abs(currentLocation.lng - dropoffLongitude) <= threshold
                ) {
                    showMessage("Passenger has been dropped off.");
                    const dropoffMessage = {
                        type: 'locationUpdate',
                        driverId: driverId,
                        passengerId: passengerId,
                        location: currentLocation,
                        role: 'driver',
                    };
                    document.getElementById('dashboard').style.display = 'block';
                    document.getElementById('passenger-management').style.display = 'none';
                    
                    document.getElementById('ride-info').style.display = 'none';
                    
                    document.getElementById('map').style.display = 'none';
                    ws.send(JSON.stringify(dropoffMessage));

                    clearInterval(locationUpdateInterval);
                    return; 
                }

                // Send location update to the server
                const locationUpdateMessage = {
                    type: 'locationUpdate',
                    driverId: driverId,
                    passengerId: passengerId,
                    location: currentLocation,
                    role: 'driver',
                };
                console.log("Sending location update to server:", JSON.stringify(locationUpdateMessage));
                ws.send(JSON.stringify(locationUpdateMessage));

                console.log("Location update sent.");
            }, handleError);
        } else {
            console.error('Geolocation is not supported by this browser.');
            alert('Geolocation is not supported by this browser.');
        }
    }
}

function handleError(error) {
    console.error("Geolocation Error:", error);

    switch (error.code) {
        case error.PERMISSION_DENIED:
            console.log('User denied the request for Geolocation.');
            alert('User denied the request for Geolocation.');
            break;
        case error.POSITION_UNAVAILABLE:
            console.log('Location information is unavailable.');
            alert('Location information is unavailable.');
            break;
        case error.TIMEOUT:
            console.log('The request to get user location timed out.');
            alert('The request to get user location timed out.');
            break;
        case error.UNKNOWN_ERROR:
            console.log('An unknown error occurred.');
            alert('An unknown error occurred.');
            break;
    }
}

function initializeMap(initialLocation) {
    map = L.map("map").setView([initialLocation.lat, initialLocation.lng], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
    }).addTo(map);
    driverMarker = L.marker([initialLocation.lat, initialLocation.lng]).addTo(map);
    driverMarker.bindPopup("You are here").openPopup();
    if (pickupMarker) map.removeLayer(pickupMarker);
    if (dropoffMarker) map.removeLayer(dropoffMarker);
    pickupMarker = L.marker([pickup_latitude, pickup_longitude])
        .addTo(map)
        .bindPopup('Pickup Location')
        .openPopup();

    dropoffMarker = L.marker([dropoff_latitude, dropoff_longitude])
        .addTo(map)
        .bindPopup('Drop-off Location');

   
    const bounds = L.latLngBounds(
        [pickup_latitude, pickup_longitude],
        [dropoff_latitude, dropoff_longitude]
    );
    map.fitBounds(bounds);
}

function updateDriverMarker(location) {
    if (driverMarker) {
        driverMarker.setLatLng([location.lat, location.lng]); 
        map.setView([location.lat, location.lng]); 
    }

}