        // MANAGE THE COMPARISION SECTION TABLE

        async function fetchSubscriptionPlans() {
            try {
                const response = await fetch('/data/subscription.json');
                if (!response.ok) {
                    throw new Error('Failed to load subscription data');
                }
                const data = await response.json();
                // console.log('Subscription Plans:', data); // Log the actual data

                // Flatten the nested array and extract the first element
                const subscriptions = data.flat().map((item) => item.plan);
                if (subscriptions.length === 0) {
                    throw new Error('No valid subscription data found');
                }

                console.log('sub found', subscriptions.length);
                // Extract unique plan names across all subscriptions
                function extractPlanNames(subscriptions) {
                    if (subscriptions.length === 0) return [];
                    return Array.from(
                        new Set(
                            subscriptions.flatMap((subscription) =>
                                Object.keys(subscription)
                            )
                        )
                    );
                }

                const planNames = extractPlanNames(subscriptions);
                let tableHeader = `<thead><tr><th></th>`;
                subscriptions.forEach((subscription, index) => {
                    planNames.forEach((planName) => {
                        const plan = subscription[planName];
                        if (plan && plan.name) {
                            // Ensure the plan and name exist
                            // console.log('our x', plan.name);
                            const name = plan.name;
                            const htv = 'style-prymary';
                            if (name === 'free' || name === 'Free') {
                                const htv = 'sm-radius-top-left';
                            }
                            tableHeader += `<th class="${htv}">${name}\n <div class="d-flex justify-content-center"><div class="col-3"><button class="btn btn-sm btn-warning" onclick="editSubscriptionBtn('${name}')" name="${name}"><i class="fa fa-edit"></i></button></div><div class="col-3"><button class="btn btn-sm btn-danger" onclick="deleteComparisonPlan('${name}')" name="${name}" ><i class="fa fa-trash"></i></button> </div></div> </th>`; // Append each plan name as a table header
                        }
                    });
                });
                tableHeader += `</tr></thead>`;
                tableHeader += `<tbody>`;
                // console.log(tableHeader);
                function extractFeatureNames(subscriptions) {
                    let featureNames = [];
                    subscriptions.forEach((subscription) => {
                        for (const plan of Object.values(subscription)) {
                            if (Array.isArray(plan.data)) {
                                featureNames.push(
                                    ...plan.data.map((item) => item.name)
                                );
                            }
                        }
                    });
                    return Array.from(new Set(featureNames)); // Remove duplicates
                }
                const featureNames = extractFeatureNames(subscriptions);
                for (x = 0; x < featureNames.length; x++) {
                    // console.log('Feature Names:', featureNames[x]); // Log feature names
                    const id = featureNames[x].replace(/ /g, '_');
                    tableHeader += `<tr class="heading-row " id="${id}"><td><h6>${featureNames[x]}</h6></td>`;
                    for (s = 0; s < subscriptions.length; s++) {
                        tableHeader += `<td><h6>${featureNames[x]}</h6></td>`;
                    }
                }
                tableHeader += `</tr>`;
                const tableHtml = `
            <table class="table-responsive">
                ${tableHeader}
            </table>
        `;

                const container = document.getElementById(
                    'rainbow-compare-table'
                );
                container.innerHTML = tableHtml;
                // Log plan names and their data
                subscriptions.forEach((subscription, index) => {
                    // console.log(`Subscription ${index + 1}:`);
                    planNames.forEach((planName) => {
                        const plan = subscription[planName];
                        if (plan) {
                            // console.log(`  Plan Name: ${planName}`);
                            // console.log(`  Plan Data:`);
                            if (Array.isArray(plan.data)) {
                                plan.data.forEach((dataItem) => {
                                    const trid = dataItem.name.replace(
                                        / /g,
                                        '_'
                                    );
                                    const trElement =
                                        document.getElementById(trid);
                                    // console.log('the plan',plan.data);
                                    if (trElement) {
                                        const tridid =
                                            trid +
                                            dataItem.subOption.replace(
                                                / /g,
                                                '_'
                                            );
                                        const trElement2 =
                                            document.getElementById(tridid);
                                        if (!trElement2) {
                                            // Select the existing row by its ID
                                            var existingRow = trElement;

                                            // Create a new row element
                                            var newRow =
                                                document.createElement(
                                                    'tr'
                                                );

                                            // Set the ID of the new row
                                            newRow.id = tridid;
                                            let extratable = '';

                                            const planNamesforrow =
                                                extractPlanNames(
                                                    subscriptions
                                                );
                                            // Loop through subscriptions and add a new cell for each item
                                            for (
                                                let d = 0;
                                                d < subscriptions.length;
                                                d++
                                            ) {
                                                extratable += `<td id="${planNamesforrow[d]
                                                    }" name="${dataItem.subOption
                                                        .replace(/ /g, '_')
                                                        .replace(
                                                            /\//g,
                                                            '__'
                                                        )}" title="${dataItem.name
                                                            .replace(/ /g, '_')
                                                            .replace(
                                                                /\//g,
                                                                '__'
                                                            )}" ></td>`;
                                            }
                                            newRow.innerHTML =
                                                '<td>' +
                                                dataItem.subOption +
                                                '</td>' +
                                                extratable;
                                            // Insert the new row after the existing row
                                            existingRow.parentNode.insertBefore(
                                                newRow,
                                                existingRow.nextSibling
                                            );
                                        }
                                    }
                                });
                            } else {
                                console.log(
                                    `    No data found for this plan.`
                                );
                            }
                        } else {
                            console.log(
                                `  Plan ${planName} not found in this subscription.`
                            );
                        }
                    });
                });
                // Log plan names and their data
                subscriptions.forEach((subscription, index) => {
                    planNames.forEach((planName) => {
                        const plan = subscription[planName];
                        if (plan) {
                            if (Array.isArray(plan.data)) {
                                plan.data.forEach((dataItem) => {
                                    const trid = dataItem.name.replace(
                                        / /g,
                                        '_'
                                    );
                                    const trElement =
                                        document.getElementById(trid);
                                    const tridid = dataItem.subOption
                                        .replace(/ /g, '_')
                                        .replace(/\//g, '__');
                                    const trElement2 =
                                        document.getElementById(tridid);

                                    // Find the target element using the ID and name attributes
                                    var element = document.querySelector(
                                        '#' +
                                        planName +
                                        '[name="' +
                                        tridid +
                                        '"]' +
                                        '[title="' +
                                        trid +
                                        '"]'
                                    );
                                    console.log(
                                        'id:' +
                                        planName +
                                        'title:' +
                                        trid +
                                        'name:' +
                                        tridid
                                    );
                                    if (element) {
                                        let lastvalue = dataItem.value; // Use let instead of const here to allow re-assignment
                                        const newSpan =
                                            document.createElement('span'); // Create a new span element

                                        if (dataItem.value === 'check') {
                                            lastvalue = `<div id="editandupdateOption" class="form-group"><select class="form-control">
                                            <option value="check">check</option> <option value="uncheck">uncheck</option>
                                         </select></div>`;
                                        } else if (
                                            dataItem.value === 'uncheck'
                                        ) {
                                              lastvalue = `<div id="editandupdateOption" class="form-group"><select class="form-control">
                                            <option value="uncheck">uncheck</option>  <option value="check">check</option>
                                         </select></div>`;
                                        }else{
lastvalue = `<div class="form-group" id="editandupdateOption"><input class="form-control" value="${dataItem.value}">
                                            
                                         
                              </div>`;
                                        }

                                        // Set the innerHTML of the new span to the value of lastvalue
                                        element.innerHTML = lastvalue;

                                        // Append the new span to the element
                                        //element.appendChild(newSpan);
                                    }
                                });
                            } else {
                                console.log(
                                    `    No data found for this plan.`
                                );
                            }
                        } else {
                            console.log(
                                `  Plan ${planName} not found in this subscription.`
                            );
                        }
                    });
                });
                subscriptions.forEach((subscription, index) => {
                    console.log(index);
                    planNames.forEach((planName) => {
                        const plan = subscription[planName];
                        // console.log(plan.data);
                        if (plan) {
                            if (Array.isArray(plan.data)) {
                                plan.data.forEach((dataItem) => {
                                    plan.data.forEach((dataItem) => {
                                        const trid = dataItem.name.replace(
                                            / /g,
                                            '_'
                                        );
                                        const trElement =
                                            document.getElementById(trid);
                                        // console.log('id1: ',trid);
                                        if (trElement) {
                                            const tridid =
                                                trid +
                                                dataItem.subOption.replace(
                                                    / /g,
                                                    '_'
                                                );
                                            const trElement2 =
                                                document.getElementById(
                                                    tridid
                                                );
                                            // console.log('id1: ',tridid);
                                            // Create a new <tr> element
                                            if (trElement2) {
                                                // Select the existing row by its ID
                                                var existingRow =
                                                    document.getElementById(
                                                        tridid
                                                    );
                                                if (existingRow) {
                                                    console.log('1');
                                                }
                                                // // Append new content to the existing row
                                                // existingRow.innerHTML += '<td>'+dataItem.subOption+'</td>';
                                            }
                                        }
                                    });
                                });
                            }
                        } else {
                            console.log(
                                `  Plan not found in this subscription.`
                            );
                        }
                    });
                });
                console.clear();
            } catch (error) {
                console.error('Error loading subscription data:', error);
                const container = document.getElementById(
                    'rainbow-compare-table'
                );
                container.innerHTML =
                    '<p class="text-danger">Failed to load subscription plans. Please try again later.</p>';
            }
        }

        fetchSubscriptionPlans();
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
