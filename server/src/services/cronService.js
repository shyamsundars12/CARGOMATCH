const cron = require('node-cron');
const repo = require('../repository/lspRepository');

// Function to close bookings that are 1 day before departure
const closeBookingsBeforeDeparture = async () => {
  try {
    console.log('🕐 Running booking closure cron job...');
    
    // Get bookings that need to be closed (1 day before departure)
    const bookingsToClose = await repo.getBookingsToClose();
    
    if (bookingsToClose.length === 0) {
      console.log('✅ No bookings to close today');
      return;
    }
    
    console.log(`📦 Found ${bookingsToClose.length} bookings to close`);
    
    // Close each booking
    for (const booking of bookingsToClose) {
      try {
        // Update booking status to closed
        await repo.updateBookingStatus(booking.id, 'closed', booking.lsp_id);
        
        // Update container availability
        await repo.updateContainer(
          booking.container_id, 
          { is_available: true, status: 'available' }, 
          booking.lsp_id
        );
        
        // Create notification for LSP
        const lspProfile = await repo.getLSPProfileByUserId(booking.lsp_id);
        if (lspProfile) {
          await repo.createNotification({
            user_id: lspProfile.user_id,
            title: "Booking Auto-Closed",
            message: `Booking #${booking.id} has been automatically closed as departure is tomorrow`,
            type: 'booking_auto_closed',
            related_entity_type: 'booking',
            related_entity_id: booking.id
          });
        }
        
        // Create notification for importer/exporter
        const notifyUserId = booking.importer_id || booking.exporter_id;
        if (notifyUserId) {
          await repo.createNotification({
            user_id: notifyUserId,
            title: "Booking Closed",
            message: `Your booking #${booking.id} has been closed. Container is ready for departure.`,
            type: 'booking_closed',
            related_entity_type: 'booking',
            related_entity_id: booking.id
          });
        }
        
        console.log(`✅ Closed booking #${booking.id}`);
        
      } catch (error) {
        console.error(`❌ Error closing booking #${booking.id}:`, error.message);
      }
    }
    
    console.log('✅ Booking closure cron job completed');
    
  } catch (error) {
    console.error('❌ Error in booking closure cron job:', error.message);
  }
};

// Function to check and update shipment statuses
const updateShipmentStatuses = async () => {
  try {
    console.log('🚢 Running shipment status update cron job...');
    
    // This could include logic to automatically update shipment statuses
    // based on time elapsed, location updates, etc.
    // For now, we'll just log that the job ran
    
    console.log('✅ Shipment status update cron job completed');
    
  } catch (error) {
    console.error('❌ Error in shipment status update cron job:', error.message);
  }
};

// Function to send reminder notifications
const sendReminderNotifications = async () => {
  try {
    console.log('📧 Running reminder notifications cron job...');
    
    // This could include logic to send reminders for:
    // - Upcoming departures
    // - Pending approvals
    // - Overdue complaints
    // - etc.
    
    console.log('✅ Reminder notifications cron job completed');
    
  } catch (error) {
    console.error('❌ Error in reminder notifications cron job:', error.message);
  }
};

// Initialize cron jobs
const initializeCronJobs = () => {
  console.log('🕐 Initializing cron jobs...');
  
  // Close bookings 1 day before departure - run daily at 6 AM
  cron.schedule('0 6 * * *', closeBookingsBeforeDeparture, {
    scheduled: true,
    timezone: "UTC"
  });
  
  // Update shipment statuses - run every 4 hours
  cron.schedule('0 */4 * * *', updateShipmentStatuses, {
    scheduled: true,
    timezone: "UTC"
  });
  
  // Send reminder notifications - run daily at 9 AM
  cron.schedule('0 9 * * *', sendReminderNotifications, {
    scheduled: true,
    timezone: "UTC"
  });
  
  console.log('✅ Cron jobs initialized successfully');
};

// Manual trigger functions for testing
const triggerBookingClosure = () => {
  console.log('🔧 Manually triggering booking closure...');
  closeBookingsBeforeDeparture();
};

const triggerShipmentUpdate = () => {
  console.log('🔧 Manually triggering shipment status update...');
  updateShipmentStatuses();
};

const triggerReminderNotifications = () => {
  console.log('🔧 Manually triggering reminder notifications...');
  sendReminderNotifications();
};

module.exports = {
  initializeCronJobs,
  closeBookingsBeforeDeparture,
  updateShipmentStatuses,
  sendReminderNotifications,
  triggerBookingClosure,
  triggerShipmentUpdate,
  triggerReminderNotifications
}; 