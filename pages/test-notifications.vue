<script setup lang="ts">
import UiParentCard from '@/components/shared/UiParentCard.vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';

const notification = useNotification();

const showSuccess = () => {
  notification.success('Operation completed successfully!');
};

const showError = () => {
  notification.error('An error occurred while processing your request');
};

const showWarning = () => {
  notification.warning('Please review your input before submitting');
};

const showInfo = () => {
  notification.info('This is an informational message');
};

const showCustomDuration = () => {
  notification.success('This message will disappear in 10 seconds', 10000);
};

const showMultiple = () => {
  notification.success('First notification');
  setTimeout(() => notification.info('Second notification'), 500);
  setTimeout(() => notification.warning('Third notification'), 1000);
  setTimeout(() => notification.error('Fourth notification'), 1500);
};

// Simulate API operations
const simulateApiSuccess = async () => {
  notification.info('Processing...');
  
  setTimeout(() => {
    notification.success('Data saved successfully!');
  }, 1500);
};

const simulateApiError = async () => {
  notification.info('Processing...');
  
  setTimeout(() => {
    notification.error('Failed to save data: Server error');
  }, 1500);
};
</script>

<template>
  <UiParentCard title="Notification System Demo">
    <v-row>
      <v-col cols="12">
        <UiChildCard title="Basic Notifications">
          <div class="d-flex flex-wrap gap-2">
            <v-btn color="success" @click="showSuccess">
              <v-icon start>mdi-check-circle</v-icon>
              Success Notification
            </v-btn>
            
            <v-btn color="error" @click="showError">
              <v-icon start>mdi-alert-circle</v-icon>
              Error Notification
            </v-btn>
            
            <v-btn color="warning" @click="showWarning">
              <v-icon start>mdi-alert</v-icon>
              Warning Notification
            </v-btn>
            
            <v-btn color="info" @click="showInfo">
              <v-icon start>mdi-information</v-icon>
              Info Notification
            </v-btn>
          </div>
        </UiChildCard>
      </v-col>
      
      <v-col cols="12">
        <UiChildCard title="Custom Duration">
          <div class="d-flex flex-wrap gap-2">
            <v-btn color="primary" @click="showCustomDuration">
              Show 10 Second Message
            </v-btn>
            
            <v-btn color="secondary" @click="showMultiple">
              Show Multiple Notifications
            </v-btn>
          </div>
        </UiChildCard>
      </v-col>
      
      <v-col cols="12">
        <UiChildCard title="Simulated API Operations">
          <div class="d-flex flex-wrap gap-2">
            <v-btn color="success" @click="simulateApiSuccess">
              <v-icon start>mdi-cloud-check</v-icon>
              Simulate Successful API Call
            </v-btn>
            
            <v-btn color="error" @click="simulateApiError">
              <v-icon start>mdi-cloud-alert</v-icon>
              Simulate Failed API Call
            </v-btn>
          </div>
        </UiChildCard>
      </v-col>
      
      <v-col cols="12">
        <UiChildCard title="Usage in Code">
          <pre class="code-block">
const notification = useNotification()

// Success
notification.success('Operation completed successfully')

// Error
notification.error('Something went wrong')

// Warning
notification.warning('Please review your input')

// Info
notification.info('Here is some information')

// Custom duration (milliseconds)
notification.success('Quick message', 1500)
notification.error('Long message', 10000)
          </pre>
        </UiChildCard>
      </v-col>
    </v-row>
  </UiParentCard>
</template>

<style scoped>
.code-block {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
  font-size: 14px;
  overflow-x: auto;
}
</style>
