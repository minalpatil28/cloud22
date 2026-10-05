const MAX_STORAGE = 100 * 1024 * 1024; // 100 MB

let files = JSON.parse(localStorage.getItem("cloudFiles")) || [];

// Open file picker
function openFilePicker() {
    document.getElementById("fileInput").click();
}

// Convert bytes to readable size
function formatSize(bytes) {
    if (bytes < 1024) {
        return bytes + " B";
    }

    if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(1) + " KB";
    }

    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

// Get file extension
function getFileType(fileName) {
    const parts = fileName.split(".");

    if (parts.length === 1) {
        return "FILE";
    }

    return parts[parts.length - 1].toUpperCase();
}

// Handle uploaded files
function handleFiles(selectedFiles) {

    for (const file of selectedFiles) {

        const currentStorage = files.reduce(
            (total, item) => total + item.size,
            0
        );

        if (currentStorage + file.size > MAX_STORAGE) {
            alert(
                "Storage limit exceeded! Maximum storage is 100 MB."
            );
            continue;
        }

        const fileObject = {
            id: Date.now() + Math.random(),
            name: file.name,
            type: getFileType(file.name),
            size: file.size,
            date: new Date().toLocaleDateString(),
            data: ""
        };

        /*
         * Files under 5 MB are stored as Base64 data.
         * This allows the demo application to download them.
         */
        if (file.size <= 5 * 1024 * 1024) {

            const reader = new FileReader();

            reader.onload = function (event) {
                fileObject.data = event.target.result;

                files.push(fileObject);
                saveFiles();
                renderFiles();
            };

            reader.readAsDataURL(file);

        } else {

            alert(
                file.name +
                " is larger than 5 MB and cannot be downloaded from this demo."
            );

            files.push(fileObject);
            saveFiles();
            renderFiles();
        }
    }
}

// Save data
function saveFiles() {
    try {
        localStorage.setItem(
            "cloudFiles",
            JSON.stringify(files)
        );
    } catch (error) {
        alert(
            "Browser storage is full. Please delete some files."
        );
    }
}

// Display files
function renderFiles(list = files) {

    const tableBody =
        document.getElementById("fileTableBody");

    const emptyMessage =
        document.getElementById("emptyMessage");

    tableBody.innerHTML = "";

    if (list.length === 0) {
        emptyMessage.style.display = "block";
    } else {
        emptyMessage.style.display = "none";
    }

    list.forEach(file => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                <span class="file-name">
                    📄 ${escapeHTML(file.name)}
                </span>
            </td>

            <td>
                <span class="file-type">
                    ${escapeHTML(file.type)}
                </span>
            </td>

            <td>
                ${formatSize(file.size)}
            </td>

            <td>
                ${file.date}
            </td>

            <td>
                <button
                    class="action-btn download"
                    onclick="downloadFile('${file.id}')">
                    Download
                </button>

                <button
                    class="action-btn delete"
                    onclick="deleteFile('${file.id}')">
                    Delete
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });

    updateStatistics();
}

// Search files
function searchFiles() {

    const search =
        document.getElementById("searchInput")
            .value
            .toLowerCase();

    const filteredFiles = files.filter(file =>
        file.name.toLowerCase().includes(search)
    );

    renderFiles(filteredFiles);
}

// Delete file
function deleteFile(id) {

    const confirmed =
        confirm("Are you sure you want to delete this file?");

    if (!confirmed) {
        return;
    }

    files = files.filter(
        file => String(file.id) !== String(id)
    );

    saveFiles();
    renderFiles();
}

// Download file
function downloadFile(id) {

    const file = files.find(
        item => String(item.id) === String(id)
    );

    if (!file) {
        return;
    }

    if (!file.data) {
        alert(
            "This file is only stored as metadata in this demo and cannot be downloaded."
        );
        return;
    }

    const link = document.createElement("a");

    link.href = file.data;
    link.download = file.name;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
}

// Update statistics
function updateStatistics() {

    const totalSize = files.reduce(
        (total, file) => total + file.size,
        0
    );

    document.getElementById("fileCount")
        .textContent = files.length;

    document.getElementById("storageUsed")
        .textContent = formatSize(totalSize);

    document.getElementById("storageText")
        .textContent =
        `${formatSize(totalSize)} of 100 MB used`;

    const percentage =
        Math.min((totalSize / MAX_STORAGE) * 100, 100);

    document.getElementById("storageProgress")
        .style.width = percentage + "%";

    document.getElementById("fileStatus")
        .textContent =
        `${files.length} file${files.length === 1 ? "" : "s"}`;
}

// Prevent HTML injection in file names
function escapeHTML(value) {

    const div = document.createElement("div");

    div.textContent = value;

    return div.innerHTML;
}

// Drag and drop
const dropArea =
    document.getElementById("dropArea");

dropArea.addEventListener("dragover", function (event) {

    event.preventDefault();

    dropArea.classList.add("dragover");
});

dropArea.addEventListener("dragleave", function () {

    dropArea.classList.remove("dragover");
});

dropArea.addEventListener("drop", function (event) {

    event.preventDefault();

    dropArea.classList.remove("dragover");

    handleFiles(event.dataTransfer.files);
});

// Initial display
renderFiles();

