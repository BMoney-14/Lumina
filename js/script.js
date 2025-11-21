/*
 * Simple JavaScript for the pool villa site.
 * Handles navigation toggling on small screens and manages the booking
 * form interactions such as price calculation and redirecting to the
 * confirmation page.
 */

document.addEventListener('DOMContentLoaded', function () {
  // Navigation toggle for mobile devices
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('nav ul');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      navMenu.classList.toggle('open');
    });
  }

  // Booking form functionality
  const bookingForm = document.getElementById('bookingForm');
  const summarySection = document.getElementById('summary');
  const confirmBtn = document.getElementById('confirmBtn');

  // Calendar and date selection variables
  const calendarContainer = document.getElementById('calendarContainer');
  const hiddenCheckin = document.getElementById('checkin');
  const hiddenCheckout = document.getElementById('checkout');
  // Define unavailable dates (YYYY-MM-DD). Modify this array to reflect actual unavailable periods.
  const unavailableDates = [
    '2025-11-20',
    '2025-11-22',
    '2025-12-05'
  ];
  let currentYear;
  let currentMonth;
  let selectedStartDate = null;
  let selectedEndDate = null;

  /**
   * Convert a Date object to a YYYY-MM-DD string.
   * @param {Date} date
   * @returns {string}
   */
  function dateToString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Update hidden input values for check-in and check-out.
   */
  function updateHiddenFields() {
    if (hiddenCheckin) hiddenCheckin.value = selectedStartDate || '';
    if (hiddenCheckout) hiddenCheckout.value = selectedEndDate || '';
  }

  /**
   * Handle a click on a day cell. Select start and end dates.
   * @param {string} dateStr
   */
  function handleDayClick(dateStr) {
    // If no start date is selected or both start and end are already selected,
    // start a new selection with this day as the start date.
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      selectedStartDate = dateStr;
      selectedEndDate = null;
    } else {
      // Selecting the end date
      if (dateStr < selectedStartDate) {
        selectedEndDate = selectedStartDate;
        selectedStartDate = dateStr;
      } else if (dateStr === selectedStartDate) {
        // Selecting the same day again resets the end date
        selectedEndDate = null;
        selectedStartDate = dateStr;
      } else {
        selectedEndDate = dateStr;
      }
    }
    updateHiddenFields();
    generateCalendar(currentYear, currentMonth);
  }

  /**
   * Render the calendar for the specified year and month.
   * @param {number} year
   * @param {number} month
   */
  function generateCalendar(year, month) {
    if (!calendarContainer) return;
    currentYear = year;
    currentMonth = month;
    calendarContainer.innerHTML = '';

    // Calendar header with navigation
    const header = document.createElement('div');
    header.className = 'calendar-header';
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '<';
    prevBtn.addEventListener('click', () => {
      const prevDate = new Date(currentYear, currentMonth - 1);
      generateCalendar(prevDate.getFullYear(), prevDate.getMonth());
    });
    const title = document.createElement('span');
    // Use Thai month names
    const monthName = new Date(year, month).toLocaleString('th-TH', { month: 'long', year: 'numeric' });
    title.textContent = monthName;
    const nextBtn = document.createElement('button');
    nextBtn.textContent = '>';
    nextBtn.addEventListener('click', () => {
      const nextDate = new Date(currentYear, currentMonth + 1);
      generateCalendar(nextDate.getFullYear(), nextDate.getMonth());
    });
    header.appendChild(prevBtn);
    header.appendChild(title);
    header.appendChild(nextBtn);
    calendarContainer.appendChild(header);

    // Calendar grid
    const grid = document.createElement('div');
    grid.className = 'calendar-grid';
    // Day names (Sunday first for Thai locale)
    const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
    dayNames.forEach((d) => {
      const cell = document.createElement('div');
      cell.className = 'calendar-day weekday';
      cell.textContent = d;
      grid.appendChild(cell);
    });

    // Determine day of week for the first day and number of days in month
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Fill leading blanks for days from previous month
    for (let i = 0; i < firstDayOfMonth; i++) {
      const blankCell = document.createElement('div');
      blankCell.className = 'calendar-day outside-month';
      grid.appendChild(blankCell);
    }

    // Populate days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dateStr = dateToString(dateObj);
      const cell = document.createElement('div');
      cell.className = 'calendar-day';
      cell.textContent = day;

      // Unavailable dates
      if (unavailableDates.includes(dateStr)) {
        cell.classList.add('unavailable');
      }
      // Selected start/end
      if (selectedStartDate && dateStr === selectedStartDate) {
        cell.classList.add('selected');
      }
      if (selectedEndDate && dateStr === selectedEndDate) {
        cell.classList.add('selected');
      }
      // In range
      if (selectedStartDate && selectedEndDate) {
        if (dateStr > selectedStartDate && dateStr < selectedEndDate) {
          cell.classList.add('in-range');
        }
      }
      // Attach click handler for available dates
      if (!cell.classList.contains('unavailable')) {
        cell.addEventListener('click', () => handleDayClick(dateStr));
      }
      grid.appendChild(cell);
    }

    // Fill trailing blanks to complete the last week (optional for symmetrical grid)
    const totalCells = dayNames.length + firstDayOfMonth + daysInMonth;
    const remainder = totalCells % 7;
    if (remainder !== 0) {
      const blanksNeeded = 7 - remainder;
      for (let i = 0; i < blanksNeeded; i++) {
        const blankCell = document.createElement('div');
        blankCell.className = 'calendar-day outside-month';
        grid.appendChild(blankCell);
      }
    }
    calendarContainer.appendChild(grid);
  }

  // Initial calendar render on pages containing the booking form
  if (calendarContainer) {
    const today = new Date();
    generateCalendar(today.getFullYear(), today.getMonth());
  }

  if (bookingForm) {
    bookingForm.addEventListener('submit', function (e) {
      e.preventDefault();
      // Read values from number of guests and contact fields
      const guestsInput = document.getElementById('guests');
      const nameInput = document.getElementById('name');
      const phoneInput = document.getElementById('phone');
      const emailInput = document.getElementById('email');

      // Retrieve selected dates
      const startDateStr = selectedStartDate;
      const endDateStr = selectedEndDate;
      if (!startDateStr || !endDateStr) {
        alert('โปรดเลือกช่วงวันที่เข้าพักโดยคลิกในปฏิทิน');
        return;
      }
      const checkinDate = new Date(startDateStr);
      const checkoutDate = new Date(endDateStr);
      if (checkoutDate <= checkinDate) {
        alert('วันที่เช็คเอาท์ต้องหลังจากวันที่เช็คอิน');
        return;
      }
      // Calculate nights
      const msPerDay = 1000 * 60 * 60 * 24;
      const nights = Math.round((checkoutDate - checkinDate) / msPerDay);
      // Price per night (example)
      const pricePerNight = 5900;
      const totalPrice = pricePerNight * nights;
      const deposit = Math.round(totalPrice * 0.3);

      // Populate summary
      if (summarySection) {
        summarySection.innerHTML = `
          <h3>สรุปรายการจอง</h3>
          <p>วันที่เข้าพัก: ${startDateStr}</p>
          <p>วันที่ออก: ${endDateStr}</p>
          <p>จำนวนคืน: ${nights} คืน</p>
          <p>จำนวนผู้เข้าพัก: ${guestsInput.value} คน</p>
          <p>ราคาต่อคืน: ${pricePerNight.toLocaleString()} บาท</p>
          <p>ราคารวม: ${totalPrice.toLocaleString()} บาท</p>
          <p>มัดจำ (30%): ${deposit.toLocaleString()} บาท</p>
          <p><em>หมายเหตุ: ราคาจริงอาจแตกต่างขึ้นอยู่กับช่วงเวลา</em></p>
        `;
        // Confirm button
        if (!document.getElementById('confirmBtn')) {
          const btn = document.createElement('button');
          btn.id = 'confirmBtn';
          btn.className = 'btn btn-primary';
          btn.textContent = 'ยืนยันการจอง';
          summarySection.appendChild(btn);
          btn.addEventListener('click', function () {
            window.location.href = 'thanks.html';
          });
        }
        summarySection.removeAttribute('hidden');
      }
    });
  }
});