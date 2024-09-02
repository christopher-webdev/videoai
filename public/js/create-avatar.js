let index = 0;

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('UploaderContainer').append(initAvatarContainer());
    getUploadedAvatars();
});

async function getUploadedAvatars() {
    try {
        const response = await fetch(`/api/avatars`);
        const data = await response.json();

        if (!response.ok) {
            alert('Failed to fetch avatar. Please try again');
            return;
        }

        const container = document.getElementById('UpdateUploaderContainer');

        for (const img of data) {
            const imgContainer = createEl('div', {
                className: 'small-img shadow-md',
            });
            const imgEl = createEl('img', {
                className: 'object-cover',
                src: img.image,
            });
            const deleteBtn = createEl('button', {
                type: 'button',
                className:
                    'absolute top-0 right-0 bg-red-500 text-white tex-sm texxt-white px-1 rounded-md',
                textContent: 'Delete',
            });

            imgEl.addEventListener('click', () => {
                const container = document.getElementById('UploaderContainer');
                container.innerHTML = '';
                container.append(initAvatarContainer(img));
            });
            deleteBtn.addEventListener('click', async () => {
                const res = await fetch(`/api/avatars/${img._id}`, {
                    method: 'DELETE',
                });
                if (res.ok) {
                    alert('Avatar Deleted Successfully');
                    window.location.reload();
                    return;
                }
                alert('Unable to delete avatar. Please try again');
            });

            const imgName = createEl('p', {
                textContent: img.name,
                className: 'truncate-1',
            });
            imgContainer.append(imgEl, imgName, deleteBtn);
            container.append(imgContainer);
        }
    } catch (error) {
        alert('An error occurred while fetching the avatar. Please try again');
    }
}

async function handleSubmitAvatar(formData) {
    let url = `/api/avatars`,
        method = 'POST';

    if (formData.has('id')) {
        url = url + `/${formData.get('id')}`;
        method = 'PUT';
    }

    const response = await fetch(url, {
        method,
        body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
        alert(data.errors);
        return;
    }
    alert(
        formData.has('id')
            ? 'Avatar Updated successfully'
            : 'Avatar successfully uploaded!'
    );
    window.location.reload();
}

function createEl(el, props) {
    const element = document.createElement(el);
    for (const prop in props) {
        element[prop] = props[prop];
    }

    return element;
}

function initTopAvatarContainer(image = null) {
    const topContainer = createEl('div', {
        className: 'flex items-start jsutify-between w-full',
    });
    const avatarImage = createImageSelector(
        { fileName: 'avatarImage', className: 'flex-1 parent' },
        image
    );
    const controls = createAvatarControles(image);

    topContainer.append(avatarImage, controls);
    return topContainer;
}

function initAvatarContainer(image = null) {
    const container = createEl('form', {
        className: 'w-full bg-gray-300 p-2 max-w-full',
    });
    const topContainer = initTopAvatarContainer(image);
    const bottomContainer = createEl('div', {
        className: 'flex flex-wrap gap-2 w-full mt-4 max-w-full',
    });

    const addNewLocationBtn = createEl('button', {
        type: 'button',
        textContent: 'Add Location',
        className: 'add-location-btn',
    });
    addNewLocationBtn.addEventListener('click', function () {
        bottomContainer.append(
            createImageSelector({
                inputName: `location[${index}]`,
                fileName: `location[${index}]`,
            })
        );
        index++;
    });

    bottomContainer.append(addNewLocationBtn);

    if (image && image.locations.length > 0) {
        for (let i = 0; i < image.locations.length; i++) {
            bottomContainer.append(
                createImageSelector(
                    { inputName: `location[${i}]`, fileName: `location[${i}]` },
                    image.locations[i]
                )
            );
        }
    }

    container.append(topContainer, bottomContainer);

    container.addEventListener('submit', function (ev) {
        ev.preventDefault();

        const fd = new FormData(ev.target);

        if (image) {
            fd.append('id', image._id);
        }

        handleSubmitAvatar(fd);
    });
    return container;
}

function createAvatarControles(imageData = null) {
    const container = createEl('div', {
        className: 'flex-col items-center justify-between gap-4 mx-2',
    });
    const controls = createEl('div', {
        className: 'flex items-center justify-between gap-4 my-4',
    });

    const input = createEl('input', {
        required: true,
        placeholder: 'Enter avatar name (e.g: Avatar 1)',
        className: 'p-2 px-4 w-full rounded-md border-0 outline-none',
        name: 'avatarName',
        ...(imageData
            ? {
                  value: imageData.name,
              }
            : undefined),
    });
    const submitAvatar = createEl('button', {
        type: 'submit',
        className: 'p-2 bg-green-500 rounded-md text-white font-bolder',
        textContent: imageData ? 'Update Avatar' : 'Upload Avatar',
    });

    controls.append(submitAvatar);
    container.append(input, controls);
    return container;
}
function createImageSelector(options, imageData = null) {
    const background = createEl('div', {
        className: `avatar-background relative ${options?.className || ''}`,
    });
    const image = createEl('img', {
        ...(imageData
            ? {
                  src: imageData.image,
              }
            : undefined),
        className: 'w-full object-cover',
    });

    const inputName = createEl('input', {
        required: true,
        placeholder: 'Enter location (e.g: Forest)',
        className: 'ignore p-2 px-4 rounded-md border-0 outline-none block',
        name: options?.inputName,
        ...(imageData
            ? {
                  value: imageData.name,
              }
            : undefined),
    });

    const dismissThis = createEl('button', {
        type: 'button',
        textContent: 'x',
        className:
            'ignore text-sm text-red-500 rounded-full p-1 absolute top-1 right-1',
    });
    const selector = createEl('input', {
        accept: 'image/*',
        type: 'file',
        name: options?.fileName,
        ...(imageData
            ? {
                  filename: imageData.name,
              }
            : undefined),
    });

    selector.addEventListener('change', function () {
        if (this.files.length < 1) {
            alert('Please select a file');
            return;
        }
        const fr = new FileReader();
        fr.onload = function () {
            image.src = this.result;
        };
        fr.readAsDataURL(this.files[0]);
    });

    dismissThis.addEventListener('click', function () {
        index--;
        background.remove();
    });

    background.addEventListener('click', function (ev) {
        if (ev.target.classList.contains('ignore')) return;
        if (ev.target.classList.contains('ignore')) return;

        selector.click();
    });

    background.append(image, selector);

    if (!options?.className?.includes('parent')) {
        background.append(dismissThis, inputName);
    }

    return background;
}
