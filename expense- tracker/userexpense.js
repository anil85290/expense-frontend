const form = document.getElementById('expenseForm');
const amountInput = document.getElementById('amount');
const descInput = document.getElementById('description');
const categoryInput = document.getElementById('category');
const expenseListUl = document.getElementById('expenseList');
const token = localStorage.getItem('token');
const premiumBtn = document.getElementById('premium');
const mainContentArea = document.getElementById('mainContentArea');
const logoutButton = document.getElementById('logoutButton');

const itemsPerPageSelect = document.getElementById('itemsPerPage');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const lastPageBtn = document.getElementById('lastPage');
const pageInfoSpan = document.getElementById('pageInfo');

const cashfree = Cashfree({
    mode: "sandbox",
});

let currentPage = 1;
let itemsPerPage = localStorage.getItem('itemsPerPage') ? parseInt(localStorage.getItem('itemsPerPage')) : 5;
let totalPages = 1;

if (itemsPerPageSelect) {
    itemsPerPageSelect.value = itemsPerPage;
}


if (premiumBtn) {
    premiumBtn.addEventListener('click', async () => {
        try {
            const res = await axios.post('http://localhost:3000/premium/pay', null, { headers: { "Authorization": token } });
            const data = res.data;
            const paymentSessionId = data.paymentSessionId;
            const orderId = data.orderId;

            let checkoutOptions = {
                paymentSessionId: paymentSessionId,
                redirectTarget: "_modal"
            };

            const result = await cashfree.checkout(checkoutOptions);
            if (result.error) {
                console.log("User has closed the popup or there is some payment error, Check for Payment Status");
                console.log(result.error);
            }
            if (result.redirect) {
                console.log("Payment will be redirected");
            }
            if (result.paymentDetails) {
                console.log("Payment has been completed, Check for Payment Status");
                console.log(result.paymentDetails.paymentMessage);
                const res = await axios.get(`http://localhost:3000/premium/getPaymentStatus/${orderId}`, { headers: { "Authorization": token } });
                if (res.data.paymentStatus == 'Succcessful') {
                    alert('Your payment is ' + res.data.paymentStatus);
                    showPremiumUser();
                    fetchExpenses();
                } else {
                    alert('Your payment has ' + res.data.paymentStatus);
                }
            }
        } catch (error) {
            console.error('Error during premium payment:', error);
            alert('Failed to process premium payment. Please try again.');
        }
    });
}

if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        alert('Logging out...');
        localStorage.removeItem('token');
        window.location.href = '../login/login.htm';
    });
}

if (form) {
    form.addEventListener('submit', addExpense);
}

if (itemsPerPageSelect) {
    itemsPerPageSelect.addEventListener('change', (e) => {
        itemsPerPage = parseInt(e.target.value);
        localStorage.setItem('itemsPerPage', itemsPerPage);
        currentPage = 1;
        fetchExpenses();
    });
}

if (prevPageBtn) {
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchExpenses();
        }
    });
}

if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            fetchExpenses();
        }
    });
}

if (lastPageBtn) {
    lastPageBtn.addEventListener('click', () => {
        currentPage = totalPages;
        fetchExpenses();
    });
}

// --- Functions ---

function showPremiumUser() {
    const premiumMessage = document.createElement('div');
    premiumMessage.id = 'premiumMessage';
    premiumMessage.className = 'bg-green-500 text-white p-4 text-center';
    premiumMessage.innerText = 'You are a premium user! Enjoy your benefits!';
    document.body.insertBefore(premiumMessage, document.body.firstChild);
    if (premiumBtn) {
        premiumBtn.remove();
    }

    if (mainContentArea) {
        const leaderboardContainer = document.createElement('div');
        leaderboardContainer.className = 'mt-6 flex flex-col space-y-2';

        const showLeaderboardBtn = document.createElement('button');
        showLeaderboardBtn.id = 'showLeaderboardBtn';
        showLeaderboardBtn.className = 'w-full bg-purple-500 text-white p-2 rounded-md hover:bg-purple-600';
        showLeaderboardBtn.innerText = 'Show Leaderboard';
        leaderboardContainer.appendChild(showLeaderboardBtn);

        const downloadExpensesBtn = document.createElement('button');
        downloadExpensesBtn.id = 'downloadExpensesBtn';
        downloadExpensesBtn.className = 'w-full bg-indigo-500 text-white p-2 rounded-md hover:bg-indigo-600';
        downloadExpensesBtn.innerText = 'Download Expenses';
        leaderboardContainer.appendChild(downloadExpensesBtn);

        const leaderboardDisplay = document.createElement('div');
        leaderboardDisplay.id = 'leaderboardDisplay';
        leaderboardDisplay.className = 'mt-4 p-4 border border-gray-200 rounded-md bg-gray-50 hidden';
        leaderboardContainer.appendChild(leaderboardDisplay);

        const leaderboardTitle = document.createElement('h4');
        leaderboardTitle.className = 'text-md font-semibold mb-2';
        leaderboardTitle.innerText = 'Leaderboard';
        leaderboardDisplay.appendChild(leaderboardTitle);

        const leaderboardList = document.createElement('ul');
        leaderboardList.id = 'leaderboardList';
        leaderboardList.className = 'list-none text-gray-800';
        leaderboardDisplay.appendChild(leaderboardList);

        mainContentArea.appendChild(leaderboardContainer);

        showLeaderboardBtn.addEventListener('click', () => {
            leaderboardDisplay.classList.toggle('hidden');
            if (!leaderboardDisplay.classList.contains('hidden')) {
                showLeaderboard(leaderboardList);
            }
        });

        downloadExpensesBtn.addEventListener('click', downloadExpenses);
    }
}

async function addExpense(e) {
    e.preventDefault();
    try {
        if (amountInput.value.trim() === "" || descInput.value.trim() === "" || categoryInput.value.trim() === "") {
            alert("Please fill in all fields.");
            return;
        }
        let obj = {
            amount: amountInput.value.trim(),
            description: descInput.value.trim(),
            category: categoryInput.value.trim()
        };
        await axios.post("http://localhost:3000/expense/save", obj, { headers: { "Authorization": token } });
        resetForm();
        currentPage = 1;
        fetchExpenses();
    } catch (error) {
        console.error('Error adding expense:', error);
        alert('Failed to add expense. Please try again.');
    }
}

async function fetchExpenses() {
    try {
        const response = await axios.get(`http://localhost:3000/expense/getall?page=${currentPage}&limit=${itemsPerPage}`, {
            headers: { "Authorization": token }
        });

        const { data, pagination, ispremiumUser } = response.data;

        if (expenseListUl) {
            expenseListUl.innerHTML = '';
        }

        currentPage = pagination.currentPage;
        totalPages = pagination.totalPages;
        if (ispremiumUser && !document.getElementById('premiumMessage')) {
            showPremiumUser();
        }

        if (data.length === 0) {
            if (expenseListUl) {
                expenseListUl.innerHTML = '<li class="text-gray-500 p-2">No expenses to display for this page.</li>';
            }
        } else {
            data.forEach((exp) => {
                showExpenses(exp);
            });
        }
        updatePaginationControls();

    } catch (error) {
        console.error('Error fetching expenses:', error);
        if (expenseListUl) {
            expenseListUl.innerHTML = '<li class="text-red-500 p-2">Failed to load expenses. Please try again.</li>';
        }
        updatePaginationControls();
    }
}

function showExpenses(data) {
    let newele = document.createElement("li");
    newele.className = "grid grid-cols-5 gap-2 items-center p-2 border-b border-gray-200";
    const expenseDate = new Date(data.createdAt).toLocaleDateString();

    let amountSpan = document.createElement('span');
    amountSpan.className = 'col-span-1';
    amountSpan.innerText = `₹${data.amount}`;

    let categorySpan = document.createElement('span');
    categorySpan.className = 'col-span-1';
    categorySpan.innerText = data.category;

    let descSpan = document.createElement('span');
    descSpan.className = 'col-span-1';
    descSpan.innerText = data.description;

    let dateSpan = document.createElement('span');
    dateSpan.className = 'col-span-1 text-sm text-gray-500';
    dateSpan.innerText = expenseDate;

    let deleteBtn = document.createElement('button');
    deleteBtn.className = 'col-span-1 bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 justify-self-end';
    deleteBtn.innerText = 'Delete';
    deleteBtn.onclick = () => deleteExpense(data.id);

    newele.appendChild(amountSpan);
    newele.appendChild(categorySpan);
    newele.appendChild(descSpan);
    newele.appendChild(dateSpan);
    newele.appendChild(deleteBtn);

    expenseListUl.appendChild(newele);
}

async function deleteExpense(id) {
    try {
        await axios.delete(`http://localhost:3000/expense/delete/${id}`, { headers: { "Authorization": token } });
        fetchExpenses();
    } catch (error) {
        console.error('Error deleting expense:', error);
        alert('Failed to delete expense. Please try again.');
    }
}

function resetForm() {
    amountInput.value = '';
    descInput.value = '';
    categoryInput.value = '';
}

function updatePaginationControls() {
    if (pageInfoSpan) {
        pageInfoSpan.innerText = `Page ${currentPage} of ${totalPages}`;
    }

    if (prevPageBtn) {
        prevPageBtn.disabled = currentPage === 1;
        prevPageBtn.classList.toggle('opacity-50', currentPage === 1);
        prevPageBtn.classList.toggle('cursor-not-allowed', currentPage === 1);
    }

    if (nextPageBtn) {
        nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
        nextPageBtn.classList.toggle('opacity-50', currentPage === totalPages || totalPages === 0);
        nextPageBtn.classList.toggle('cursor-not-allowed', currentPage === totalPages || totalPages === 0);
    }

    if (lastPageBtn) {
        lastPageBtn.disabled = currentPage === totalPages || totalPages === 0;
        lastPageBtn.classList.toggle('opacity-50', currentPage === totalPages || totalPages === 0);
        lastPageBtn.classList.toggle('cursor-not-allowed', currentPage === totalPages || totalPages === 0);
    }
}


async function showLeaderboard(leaderboardListElement) {
    try {
        const res = await axios.get('http://localhost:3000/premiumFeature/showLeaderBoard', { headers: { "Authorization": token } });
        const leaderboardData = res.data;

        leaderboardListElement.innerHTML = '';

        if (leaderboardData.length === 0) {
            leaderboardListElement.innerHTML = '<li class="p-2">No users on the leaderboard yet.</li>';
            return;
        }

        leaderboardData.forEach((user, index) => {
            const listItem = document.createElement('li');
            listItem.className = 'p-2 border-b border-gray-100 last:border-b-0 flex justify-between items-center';
            listItem.innerHTML = `
                <span>${index + 1}. ${user.name}</span>
                <span class="font-semibold text-gray-900">₹${user.totalExpenses || 0}</span>
            `;
            leaderboardListElement.appendChild(listItem);
        });

    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        leaderboardListElement.innerHTML = '<li class="p-2 text-red-500">Failed to load leaderboard.</li>';
    }
}

async function downloadExpenses() {
    try {
        const response = await axios.get('http://localhost:3000/premiumFeature/download', {
            headers: { "Authorization": token },
            responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'expenses.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        alert('Expenses downloaded successfully!');

    } catch (error) {
        console.error('Error downloading expenses:', error);
        alert('Failed to download expenses. Please try again.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!token) {
        window.location.href = './login.htm';
        return;
    }
    fetchExpenses();
});

