document.addEventListener('DOMContentLoaded', () => {
    let AvailablePackages = {};

    document
        .getElementById('AddPackageBtn')
        .addEventListener('click', () => addNewPackageField(undefined, false));

    document
        .getElementById('UpdatePackageBtn')
        .addEventListener('click', () => getPackages(true));

    getPackages();
    updatePackage(data);
});

async function updatePackage(data) {
    try {
        const response = await fetch('/api/packages', {
            method: 'PUT',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const result = await response.json();
        console.log(result);
    } catch (error) {
        console.log('🚀 ~ updatePackage ~ error:', error);
    }
}

async function createPackage(data) {
    try {
        const response = await fetch('/api/packages', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const result = await response.json();
        console.log(result);
    } catch (error) {
        console.log('🚀 ~ createPackage ~ error:', error);
    }
}

function getPackages(isUpdate = false) {
    fetch('/api/packages')
        .then((response) => response.json())
        .then(async ({ data }) => {
            const resq = await fetch('/api/packages/list');
            AvailablePackages = (await resq.json()).data;

            let options = '';
            for (const pkg of AvailablePackages.allowedPackages) {
                options += `<option value='${pkg.name}'>${pkg.name}</option>`;
            }

            const packageSelect = document.getElementById('subscriptionPlan');
            if (packageSelect) {
                packageSelect.innerHTML = options;
            } else {
                console.error('Element with ID "subscriptionPlan" not found.');
            }

            if (isUpdate) {
                // Populate existing packages for updating
                for (const pkg of data.pkgs) {
                    addNewPackageField(pkg, true);
                }
            } else {
                // Create new package fields
                addNewPackageField();
            }
        });
}

function buildFormData(form) {
    const formData = new FormData(form);
    const formObject = {};
    const benefits = [];

    for (const [key, value] of formData) {
        if (key === 'benefits') {
            benefits.push({ name: value, isAvailable: false });
        } else if (key === 'isAvailable' && benefits.length > 0) {
            benefits[benefits.length - 1].isAvailable = value === 'on';
        } else {
            if (formObject[key]) {
                if (Array.isArray(formObject[key])) {
                    formObject[key].push(value);
                } else {
                    formObject[key] = [formObject[key], value];
                }
            } else {
                formObject[key] = value;
            }
        }
    }

    formObject.benefits = benefits;
    return formObject;
}

function addNewPackageField(pkg = {}, isUpdate = false) {
    const container = document.createElement('form');
    const benefitInfoField = document.createElement('p');
    const benefitContainer = document.createElement('div');
    const packagePrice = document.createElement('input');
    const packageHiddenId = document.createElement('input');
    const addBenefitBtn = document.createElement('button');
    const removePackageBtn = document.createElement('button');
    const submitButton = document.createElement('button');
    const indicator = document.createElement('p');

    benefitInfoField.innerText =
        'Please check the box if the corresponding benefit is available for this package';

    const packageName = document.createElement('select');
    packageName.name = 'name';
    packageName.disabled = !isUpdate;

    const packageInterval = document.createElement('select');
    packageInterval.name = 'interval';
    packageInterval.disabled = !isUpdate;

    AvailablePackages?.allowedIntervals?.forEach((el) => {
        const option = document.createElement('option');
        option.value = el;
        option.innerText = el;
        if (pkg?.interval === el) {
            option.selected = true;
        }
        packageInterval.append(option);
    });

    AvailablePackages?.allowedPackages?.forEach((el) => {
        const option = document.createElement('option');
        option.value = el.name;
        option.innerText = el.name;
        if (pkg?.name === el.name) {
            option.selected = true;
        }
        packageName.append(option);
    });

    packageHiddenId.name = 'packageId';
    packageHiddenId.value = pkg?._id || '';
    packageHiddenId.hidden = true;

    packagePrice.name = 'amount';
    packagePrice.value = pkg?.amount || '';
    packagePrice.disabled = pkg?.name === 'Free';

    packageName.placeholder = 'Write Package name';
    packagePrice.placeholder = 'Add Price';
    packageInterval.placeholder = 'month, year';

    container.className =
        'p-4 border border-blue-500 my-4 bg-gray-300 rounded-md';
    benefitInfoField.className =
        'p-4 border my-4 bg-yellow-100 text-yellow-600';
    benefitContainer.className = 'p-2';
    packageName.className = 'p-2 mr-2';
    indicator.className = 'p-2 mr-2 !text-red-500 error-message';
    packagePrice.className = 'p-2 mr-2';
    packageInterval.className = 'p-2 mr-2';

    addBenefitBtn.className =
        'p-2 border bg-gray-500 rounded-md text-white mr-2';
    removePackageBtn.className =
        'p-2 border bg-gray-500 rounded-md text-white mr-2';
    submitButton.className =
        'p-2 border bg-gray-500 rounded-md text-white mr-2';

    removePackageBtn.type = 'button';
    addBenefitBtn.type = 'button';
    submitButton.type = 'submit';

    addBenefitBtn.innerText = 'Add Benefit';
    removePackageBtn.innerText = 'Dismiss Section';
    submitButton.innerText = isUpdate ? 'Update Package' : 'Create Package';

    if (pkg?.benefits) {
        pkg.benefits.map((b) => addBenefitField(benefitContainer, b));
    }

    addBenefitBtn.addEventListener('click', () =>
        addBenefitField(benefitContainer)
    );
    addBenefitField(benefitContainer, undefined);

    removePackageBtn.addEventListener('click', () => {
        const canContinue =
            packageName.value.length < 2 ||
            packagePrice.value.length < 2 ||
            packageInterval.value.length < 2;
        if (!canContinue) {
            if (confirm('Your inputs will be cleared')) {
                container.remove();
            }
        } else {
            container.remove();
        }
    });

    container.addEventListener('submit', (event) =>
        handleSubmitNewPackage(event, indicator, isUpdate)
    );

    container.append(
        packageName,
        packagePrice,
        packageInterval,
        addBenefitBtn,
        removePackageBtn,
        packageHiddenId
    );
    container.append(benefitInfoField, benefitContainer);
    container.append(indicator, submitButton);

    document.getElementById('packagesContainer').append(container);
}

async function handleSubmitNewPackage(event, indicator, isUpdate = false) {
    event.preventDefault();

    const formData = buildFormData(event.target);
    const formElements = event.target.elements;
    try {
        for (let i = 0; i < formElements.length; i++) {
            formElements[i].disabled = true;
        }
        indicator.textContent = isUpdate
            ? 'Please wait. Updating Plan....'
            : 'Please wait. Submitting Plan....';
        const response = await fetch(
            `/api/packages${
                formData?.packageId ? `/${formData?.packageId}` : ''
            }`,
            {
                method: formData?.packageId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ packages: formData }),
            }
        );

        const data = await response.json();
        if (!data.success) {
            indicator.textContent = data.errors;
            return;
        }

        indicator.textContent = isUpdate
            ? 'Plan Updated Successfully'
            : 'Plan Created Successfully';
    } catch (error) {
        console.log('🚀 ~ handleSubmitNewPackage ~ error:', error);
        indicator.textContent = error.response?.data?.errors || error.message;
    } finally {
        for (let i = 0; i < formElements.length; i++) {
            formElements[i].disabled = false;
        }

        setTimeout(() => {
            indicator.textContent = '';
        }, 2500);
    }
}

function addBenefitField(container, benefit) {
    const benefitContainer = document.createElement('div');
    const input = document.createElement('input');
    const isAvailable = document.createElement('input');
    const removeBtn = document.createElement('button');

    input.name = 'benefits';
    input.value = benefit?.name || '';

    isAvailable.name = 'isAvailable';
    isAvailable.checked = !!benefit?.isAvailable;
    isAvailable.className = 'p-2 mx-3';
    isAvailable.type = 'checkbox';

    benefitContainer.className = 'p-2';
    input.placeholder = 'Add a benefit for this plan';
    input.className = 'p-2 mr-2';
    removeBtn.className = 'p-2 border bg-gray-500 rounded-md text-white mr-2';
    removeBtn.innerText = 'Remove Benefit';
    removeBtn.type = 'button';

    benefitContainer.append(input, isAvailable, removeBtn);
    container.append(benefitContainer);

    removeBtn.addEventListener('click', () => {
        benefitContainer.remove();
    });
}
async function displayPackagesForUpdate() {
    const container = document.getElementById('packagesContainer');
    if (!container) {
        console.error('Element with ID "packagesContainer" not found.');
        return;
    }

    // Clear existing content
    container.innerHTML = '';

    for (const pkg of AvailablePackages.allowedPackages) {
        // Create a form for each package
        const form = document.createElement('form');
        form.className = 'package-form';
        form.innerHTML = `
            <h3 class="text-lg font-bold">${pkg.name}</h3>
            <input type="hidden" name="packageId" value="${pkg._id}">
            <label>Name:</label>
            <input type="text" name="name" value="${pkg.name}" class="border p-2 mb-2 w-full">
            <label>Price:</label>
            <input type="text" name="amount" value="${pkg.amount}" class="border p-2 mb-2 w-full">
            <label>Interval:</label>
            <input type="text" name="interval" value="${pkg.interval}" class="border p-2 mb-2 w-full">
            <div id="benefitsContainer-${pkg._id}"></div>
            <button type="submit" class="bg-blue-500 text-white p-2">Update Package</button>
        `;

        // Add benefits
        const benefitsContainer = form.querySelector(
            `#benefitsContainer-${pkg._id}`
        );
        pkg.benefits.forEach((benefit) =>
            addBenefitField(benefitsContainer, benefit)
        );

        // Create delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'bg-red-500 text-white p-2 ml-2';
        deleteBtn.textContent = 'Delete Package';
        deleteBtn.setAttribute('data-package-id', pkg._id);

        deleteBtn.addEventListener('click', handleDeletePackage);

        // Create a container for form and delete button
        const formContainer = document.createElement('div');
        formContainer.className = 'flex items-center';

        formContainer.appendChild(form);
        formContainer.appendChild(deleteBtn);

        // Append the form container to the main container
        container.appendChild(formContainer);
    }
}

async function handleDeletePackage(event) {
    const packageId = event.target.getAttribute('data-package-id');
    if (!packageId) {
        console.error('Package ID not found.');
        return;
    }

    if (confirm('Are you sure you want to delete this package?')) {
        try {
            const response = await fetch(`/packages/${packageId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();
            if (result.success) {
                alert('Package deleted successfully.');
                // Refresh the package list
                getPackages(true);
            } else {
                alert('Failed to delete package: ' + result.errors);
            }
        } catch (error) {
            console.error('Error deleting package:', error);
        }
    }
}
