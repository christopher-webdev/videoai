
document.addEventListener('DOMContentLoaded', function () {
        const editDivs = document.querySelectorAll('td #editandupdateOption');

        editDivs.forEach(div => {
            const selectElement = div.querySelector('select');

            if (selectElement) {
                selectElement.addEventListener('change', function () {
                    const parentCell = div.closest('td');
                    const nextCell = parentCell.nextElementSibling;
                    const nextInputElement = nextCell ? nextCell.querySelector('input') : null;

                    const data = {
                        id: parentCell.id,
                        name: parentCell.getAttribute('name'),
                        title: parentCell.getAttribute('title'),
                        value: nextInputElement ? nextInputElement.value : null
                    };
                    fetch('/auth/update-subscription-mortal', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    })
                    .then(response => response.text())
                    .then(responseData => {
                        handleNotificator(
                                    'error', responseData);
                    })
                    .catch(error => {
                        handleNotificator(
                                    'error', error);
                    });
                });
            }
        });
    });
    document.addEventListener('DOMContentLoaded', function () {
        const editDivs = document.querySelectorAll('td #editandupdateOption');

        editDivs.forEach(div => {
            const selectElement = div.querySelector('input');
alert(selectElement);
            if (selectElement) {
                selectElement.addEventListener('keydown', function () {
                    const parentCell = div.closest('td');
                    const nextCell = parentCell.nextElementSibling;
                    const nextInputElement = nextCell ? nextCell.querySelector('select') : null;

                    const data = {
                        id: parentCell.id,
                        name: parentCell.getAttribute('name'),
                        title: parentCell.getAttribute('title'),
                        value: nextInputElement ? nextInputElement.value : null
                    };
                    fetch('/auth/update-subscription-mortal', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    })
                    .then(response => response.text())
                    .then(responseData => {
                        handleNotificator(
                                    'info', responseData);
                    })
                    .catch(error => {
                        handleNotificator(
                                    'error', error);
                    });
                });
            }
        });
    });
