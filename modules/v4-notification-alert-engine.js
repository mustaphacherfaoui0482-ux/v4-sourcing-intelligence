// V4 Notification & Alert Engine v1
// Centralized event notification layer

class V4NotificationAlertEngine {
  constructor() {
    this.notifications = [];
    this.rules = [];
  }

  addRule(rule) {
    this.rules.push(rule);
    return rule;
  }

  createNotification(type, payload, priority = 'normal') {
    const notification = {
      id: Date.now(),
      type,
      payload,
      priority,
      status: 'unread',
      createdAt: new Date().toISOString()
    };

    this.notifications.push(notification);
    return notification;
  }

  evaluateEvent(event) {
    return this.rules
      .filter(rule => rule.condition(event))
      .map(rule => this.createNotification(rule.type, event, rule.priority));
  }

  getNotifications(status = null) {
    if (!status) return this.notifications;
    return this.notifications.filter(item => item.status === status);
  }

  markAsRead(id) {
    const notification = this.notifications.find(item => item.id === id);
    if (notification) notification.status = 'read';
    return notification;
  }
}

module.exports = V4NotificationAlertEngine;
