// ============================================
// 1. ฟังก์ชันดึงข้อมูลสินค้ามาแสดง
// ============================================
async function loadProducts() {
  const container = document.getElementById("products-container");
  if (!container) return; // ป้องกัน Error กรณีหา element ไม่เจอ

  container.innerHTML = "<p style='text-align:center;'>กำลังโหลด...</p>";

  try {
    const response = await fetch("/api/products");
    const products = await response.json();

    if (!Array.isArray(products) || products.length === 0) {
      container.innerHTML = "<p style='text-align:center;'>ยังไม่มีผลิตภัณฑ์</p>";
      return;
    }

    container.innerHTML = "";

    products.forEach(product => {
      const card = document.createElement("article");
      card.className = "card";

      const contactHTML = product.contact
        ? `<p class="contact">📞 ${product.contact}</p>`
        : "";

      card.innerHTML = `
        ${product.image_path ? `
          <div class="card-image">
            <img src="${product.image_path}" alt="${product.name}">
          </div>
        ` : `
          <div class="card-image no-image">
            <span>📷 ไม่มีรูปภาพ</span>
          </div>
        `}
        <div class="card-content">
          <div class="card-header">
            <h3>${product.name}</h3>
            <span class="category-badge">${product.category}</span>
          </div>
          <p class="producer">👥 ${product.producer}</p>
          ${contactHTML}
          <div class="card-footer">
            <span class="price">฿ ${Number(product.price).toLocaleString()}</span>
            <div class="card-actions">
              <button class="edit-btn" data-id="${product.id}">✏️ แก้</button>
              <button class="delete-btn" data-id="${product.id}">🗑️ ลบ</button>
            </div>
          </div>
        </div>
      `;
      container.appendChild(card);
    });

    // เรียกผูก Event ของปุ่ม ลบ และ แก้ไข
    attachDeleteHandlers();
    attachEditHandlers(); 

  } catch (error) {
    console.error("Fetch Error:", error);
    container.innerHTML = `<p style="color:red; text-align:center;">Error: ${error.message}</p>`;
  }
}

// ============================================
// 2. ฟังก์ชันสำหรับลบสินค้า
// ============================================
function attachDeleteHandlers() {
  const deleteButtons = document.querySelectorAll(".delete-btn");
  deleteButtons.forEach(button => {
    button.addEventListener("click", async (e) => {
      const id = e.target.getAttribute("data-id");
      if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้?")) {
        try {
          const response = await fetch(`/api/products/${id}`, {
            method: "DELETE"
          });
          if (response.ok) {
            loadProducts(); // โหลดรายการใหม่หลังจากลบสำเร็จ
          } else {
            alert("ไม่สามารถลบสินค้าได้");
          }
        } catch (error) {
          console.error("Delete Error:", error);
        }
      }
    });
  });
}

// ============================================
// 3. จัดการ Modal แก้ไขสินค้า (เพิ่ม Null Check ป้องกัน Script พัง)
// ============================================
function openEditModal(product) {
  const modal = document.getElementById("edit-modal");
  if (!modal) return;

  document.getElementById("edit-id").value = product.id;
  document.getElementById("edit-name").value = product.name;
  document.getElementById("edit-producer").value = product.producer;
  document.getElementById("edit-price").value = product.price;
  document.getElementById("edit-category").value = product.category;
  document.getElementById("edit-contact").value = product.contact || "";

  modal.classList.remove("hidden");
}

function closeEditModal() {
  const modal = document.getElementById("edit-modal");
  const editForm = document.getElementById("edit-form");
  if (modal) modal.classList.add("hidden");
  if (editForm) editForm.reset();
}

function attachEditHandlers() {
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      try {
        const response = await fetch(`/api/products/${id}`);
        const product = await response.json();
        openEditModal(product);
      } catch (error) {
        console.error("Fetch product error:", error);
      }
    });
  });
}

// ============================================
// 4. จัดการ Event Listeners ทั้งหมดตอน DOM พร้อม
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  // โหลดรายการสินค้าทันที
  loadProducts();

  // Setup Modal Events (มี Null Check เพื่อความปลอดภัย)
  const closeBtn = document.getElementById("modal-close");
  const cancelBtn = document.getElementById("cancel-btn");
  const modal = document.getElementById("edit-modal");
  const editForm = document.getElementById("edit-form");

  if (closeBtn) closeBtn.addEventListener("click", closeEditModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeEditModal);

  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeEditModal();
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal && !modal.classList.contains("hidden")) {
      closeEditModal();
    }
  });

  // Submit Edit Form
  if (editForm) {
    editForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const id = document.getElementById("edit-id").value;
      const updatedData = {
        name: document.getElementById("edit-name").value,
        producer: document.getElementById("edit-producer").value,
        price: Number(document.getElementById("edit-price").value),
        category: document.getElementById("edit-category").value,
        contact: document.getElementById("edit-contact").value || null
      };

      try {
        const response = await fetch(`/api/products/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "แก้ไขไม่สำเร็จ");
        }

        closeEditModal();
        loadProducts();
        alert("✅ บันทึกสำเร็จ");

      } catch (error) {
        alert("❌ " + error.message);
      }
    });
  }

  // ฟอร์มเพิ่มสินค้า
  const addForm = document.getElementById("add-product-form");
  if (addForm) {
    addForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(addForm);

      try {
        const response = await fetch("/api/products", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          addForm.reset();
          loadProducts();
        } else {
          const errorData = await response.json();
          alert(`เกิดข้อผิดพลาด: ${errorData.error}`);
        }
      } catch (error) {
        console.error("Error adding product:", error);
      }
    });
  }
});