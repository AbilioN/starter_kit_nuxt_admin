# Notification System

This document explains how to use the notification/flash message system in the application.

## Overview

The notification system provides visual feedback for user actions using Vuetify Snackbars with styled alerts.

## Composable: useNotification()

### Available Functions

```typescript
const notification = useNotification()

// Show specific notification types
notification.success('Operation completed successfully')
notification.error('Something went wrong')
notification.warning('Please review your input')
notification.info('Here is some information')

// Custom duration (default: 3000ms)
notification.success('Quick message', 1500)
notification.error('Long error message', 5000)

// Manual close
notification.close()
```

## Usage Examples

### 1. Success Notification
```vue
<script setup>
const notification = useNotification()

const saveData = async () => {
  try {
    const result = await api.save()
    
    if (result.success) {
      notification.success('Data saved successfully')
    }
  } catch (error) {
    notification.error('Failed to save data')
  }
}
</script>
```

### 2. Error Notification
```vue
<script setup>
const notification = useNotification()

const deleteItem = async (id: number) => {
  try {
    await api.delete(id)
    notification.success('Item deleted successfully')
  } catch (error) {
    notification.error(error.message || 'Failed to delete item')
  }
}
</script>
```

### 3. Warning Notification
```vue
<script setup>
const notification = useNotification()

const validateForm = () => {
  if (!formData.email) {
    notification.warning('Email is required')
    return false
  }
  return true
}
</script>
```

### 4. Info Notification
```vue
<script setup>
const notification = useNotification()

const loadData = async () => {
  notification.info('Loading data...')
  await api.fetchData()
  notification.success('Data loaded')
}
</script>
```

## Integration Examples

### Login Form
```typescript
const handleLogin = async () => {
  try {
    const result = await login(email, password)
    
    if (result.success) {
      notification.success('Login successful')
      navigateTo('/dashboard')
    } else {
      notification.error(result.error || 'Login failed')
    }
  } catch (error) {
    notification.error('Unexpected error')
  }
}
```

### Role Management
```typescript
// Creating a role
const createRole = async () => {
  try {
    const result = await authService.createRole(roleData)
    
    if (result.success) {
      notification.success('Role created successfully')
      closeDialog()
      reloadRoles()
    } else {
      notification.error(result.error || 'Failed to create role')
    }
  } catch (error) {
    notification.error('Unexpected error')
  }
}

// Updating a role
const updateRole = async () => {
  try {
    const result = await authService.updateRole(roleData)
    
    if (result.success) {
      notification.success('Role updated successfully')
    } else {
      notification.error(result.error || 'Failed to update role')
    }
  } catch (error) {
    notification.error('Unexpected error')
  }
}

// Deleting a role
const deleteRole = async () => {
  try {
    const result = await authService.deleteRole({ id: roleId })
    
    if (result.success) {
      notification.success('Role deleted successfully')
    } else {
      notification.error(result.error || 'Failed to delete role')
    }
  } catch (error) {
    notification.error('Unexpected error')
  }
}
```

## Notification Types

| Type | Color | Icon | Use Case |
|------|-------|------|----------|
| success | Green | Check circle | Successful operations |
| error | Red | Alert circle | Failed operations, errors |
| warning | Orange | Alert | Warnings, validation errors |
| info | Blue | Information | Informational messages |

## Styling

The notification uses the same styling as the alert components in `/ui-components/alerts`:
- **Variant**: tonal (semi-transparent background)
- **Border**: Start border for visual emphasis
- **Location**: Top right corner
- **Auto-dismiss**: 3 seconds (default, customizable)
- **Manual close**: X button available

## Component Structure

```vue
<v-snackbar location="top right">
  <v-alert type="success" variant="tonal" border="start">
    <v-icon>mdi-check-circle</v-icon>
    <span>Message text</span>
    <v-btn icon @click="close">mdi-close</v-btn>
  </v-alert>
</v-snackbar>
```

## Best Practices

### 1. Always provide feedback
```typescript
// ✅ Good
await saveData()
notification.success('Data saved')

// ❌ Bad
await saveData()
// No feedback
```

### 2. Use appropriate types
```typescript
// ✅ Good
if (validation.failed) {
  notification.warning('Please check your input')
}

// ❌ Bad
if (validation.failed) {
  notification.error('Please check your input') // Use warning instead
}
```

### 3. Provide context
```typescript
// ✅ Good
notification.error('Failed to delete user: Permission denied')

// ❌ Bad
notification.error('Error') // Too generic
```

### 4. Handle API errors
```typescript
// ✅ Good
try {
  const result = await api.call()
  if (result.success) {
    notification.success(result.message)
  } else {
    notification.error(result.error || 'Operation failed')
  }
} catch (error) {
  notification.error(error.message || 'Unexpected error')
}
```

## Global State

The notification system uses Nuxt's `useState` for global state management:
- **Reactive**: Updates automatically across components
- **SSR-safe**: Works with server-side rendering
- **Persistent**: State maintained during navigation

## Customization

### Custom Duration
```typescript
notification.success('Quick message', 1500) // 1.5 seconds
notification.info('Important info', 10000) // 10 seconds
```

### Manual Control
```typescript
const notification = useNotification()

// Show notification
notification.info('Processing...')

// Close programmatically
setTimeout(() => {
  notification.close()
}, 2000)
```

## Testing

To test notifications in development:

```javascript
// In browser console
const { success, error, warning, info } = useNotification()

success('Test success message')
error('Test error message')
warning('Test warning message')
info('Test info message')
```
