var button = document.getElementById('toggle-target');

button.onclick = function() {
    var input = document.getElementById('address-input');
    if (input.style.display !== 'none') {
        input.style.display = 'none';
    }
    else {
        input.style.display = 'block';
        input.focus();
    }
};
