const requests = [
     fetch(`/api/config?c=affiliateErrorMessage&query=value`).then(res=>res.json()),
     fetch(`/api/config?c=withdrawableAmount&query=value`).then(res=>res.json()),
     fetch(`/api/config?c=earningPerUserReferered&query=value`).then(res=>res.json()),
]

document.addEventListener('DOMContentLoaded', function () {
    const planDurationSettingControls = document.querySelectorAll('.planDurationSettingControl');
    const earningParUpgradedRefererForm = document.querySelector('#earningParUpgradedRefererForm');
    const withdrawableAmountForm = document.querySelector('#withdrawableAmountForm');
    const earningPerUserRefereredForm = document.querySelector('#earningPerUserRefereredForm');


    handlePlanDurationChange("month");
    planDurationSettingControls.forEach((el) => {
        el.addEventListener('click', (ev) => {
            planDurationSettingControls.forEach((ell) =>ell.classList.remove('active'));
            ev.target.classList.add('active');
            handlePlanDurationChange(ev.target.dataset.name);
        });
    });

    earningParUpgradedRefererForm.addEventListener("submit", handleEarningParUpgradedReferer)
    withdrawableAmountForm.addEventListener("submit", handleWithdrawableAmount)
    earningPerUserRefereredForm.addEventListener("submit", handleEarningPerUserReferered)
    getAffiliateSettings()
});



async function handleEarningPerUserReferered(ev){
    ev.preventDefault()
    try {
        const response = await fetch(`/api/config?c=earningPerUserReferered`, {
            body: JSON.stringify(buildFormData(ev.target)),
            method: 'PUT',
            headers:{
                "Content-Type": "application/json"
            }
         })
         const data = await response.json()
         if(response.ok){
             alert("Success")
             return
         }
         alert("Failure")
     } catch (error) {
        alert("An Error occured. Please try again")
     } 
}
async function handleWithdrawableAmount(ev){
    ev.preventDefault()
    try {
        const response = await fetch(`/api/config?c=withdrawableAmount`, {
            body: JSON.stringify(buildFormData(ev.target)),
            method: 'PUT',
            headers:{
                "Content-Type": "application/json"
            }
         })
         const data = await response.json()
         if(response.ok){
             alert("Success")
             return
         }
         alert("Failure")
     } catch (error) {
        alert("An Error occured. Please try again")
     } 
}

async function getAffiliateSettings(){
    try {
        const [affiliateErrorMessage, withdrawableAmount, earningPerUserReferered] = (await Promise.allSettled(requests)).map(req=>req?.value)



        
        document.getElementById('affiliateErrorMessage').value = affiliateErrorMessage.value
        document.getElementById('withdrawableAmount').value = withdrawableAmount.value
        document.getElementById('earningPerUserReferered').value = earningPerUserReferered.value
       
    } catch (error) {
        console.log('🚀 ~ handlePlanDurationChange ~ error:', error);
    }
}


async function handleEarningParUpgradedReferer(ev){
    ev.preventDefault()
    const fd = new FormData(ev.target)
    const key = fd.get("key")
    fd.delete("key")
    const data = []
   
    for (const [key, value] of fd) {
        data.push({name: key, amount: value});
    }
    const payload = {
        [key] : data,
        key
    }
    
    try {
       const response = await fetch(`/api/config?c=earningPerUpgradedReferer`, {
            body: JSON.stringify(payload),
            method: 'PUT',
            headers:{
                "Content-Type": "application/json"
            }
        })
        const data = await response.json()
        if(response.ok){
            alert("Success")
            return
        }
        alert("Failure")
    } catch (error) {
        alert("An Error occured. Please try again")
    }
}
async function handlePlanDurationChange(name) {
    const container = document.getElementById('planDurationSetting');
    container.innerHTML = '<b className="text-center text-md mx-auto my-4">Please wait. Loading...</b>';
    try {
        const response = await fetch(`/api/config?c=earningPerUpgradedReferer&query=value.${name}`);
        const data = await response.json();
        let i = 0
        container.innerHTML = ''
        for (const plan of data.value[name]) {
            i++;
            container.append(createCol2Input(plan.name, plan.amount));
        }
        const hidden = createCol2Input("key", name)
        hidden.classList.add("hidden")
        container.append(hidden);
    } catch (error) {
        alert("An Error occured. Please try again")
    }
}


function createCol2Input(name = '', value = "", options = {}) {
    const col2 = createEl('div', {
        className: 'flex flex-wrap p-2 gap-4 w-full ml-4',
    });
    const plan = createEl('p', { textContent: name });
    const amountInput = createEl('input', {
        name,
        placeholder: '(e.g: 30)',
        className: 'flex-1 w-full',
        value,
        ...options
    });

    col2.append(plan, amountInput);
    return col2;
}

function buildFormData(form, extraFields = {}) {
    const formData = new FormData(form);
    const formObject = {};

    for (const [key, value] of formData) {
        formObject[key] = value;
    }
    return { ...formObject, ...extraFields };
}
