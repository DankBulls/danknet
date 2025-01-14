import meshtastic
import meshtastic.serial_interface
import json
import time
from datetime import datetime
from threading import Thread, Lock
import queue
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MeshHandler:
    def __init__(self, db):
        self.db = db
        self.interface = None
        self.connected = False
        self.message_queue = queue.Queue()
        self.nodes = {}
        self.node_lock = Lock()
        
    def connect(self, port=None):
        """Connect to the Meshtastic device"""
        try:
            if port:
                self.interface = meshtastic.serial_interface.SerialInterface(port)
            else:
                self.interface = meshtastic.serial_interface.SerialInterface()
            
            self.connected = True
            self.interface.onReceive = self.on_receive
            self.interface.onConnection = self.on_connection
            self.interface.onNode = self.on_node
            
            # Start message processing thread
            Thread(target=self._process_messages, daemon=True).start()
            
            logger.info("Successfully connected to Meshtastic device")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Meshtastic device: {e}")
            return False

    def on_receive(self, packet, interface):
        """Handle incoming messages"""
        try:
            from_id = packet['from']
            message = packet.get('decoded', {}).get('text', '')
            
            if not message:
                return
            
            # Parse message for different types
            try:
                data = json.loads(message)
                message_type = data.get('type', 'text')
            except json.JSONDecodeError:
                message_type = 'text'
                data = {'content': message}
            
            # Add to processing queue
            self.message_queue.put({
                'from_id': from_id,
                'type': message_type,
                'data': data,
                'timestamp': datetime.utcnow()
            })
            
        except Exception as e:
            logger.error(f"Error processing received message: {e}")

    def on_connection(self, interface, topic=None):
        """Handle connection events"""
        logger.info(f"Connection event: {topic}")
        self.connected = True

    def on_node(self, node):
        """Handle node updates"""
        with self.node_lock:
            self.nodes[node['num']] = {
                'id': node['num'],
                'user': node.get('user', {}),
                'position': node.get('position', {}),
                'last_seen': datetime.utcnow()
            }

    def _process_messages(self):
        """Background thread to process received messages"""
        while True:
            try:
                message = self.message_queue.get()
                
                if message['type'] == 'location':
                    self._handle_location_update(message)
                elif message['type'] == 'status':
                    self._handle_status_update(message)
                elif message['type'] == 'text':
                    self._handle_text_message(message)
                elif message['type'] == 'emergency':
                    self._handle_emergency(message)
                
                self.message_queue.task_done()
                
            except Exception as e:
                logger.error(f"Error processing message: {e}")
            
            time.sleep(0.1)  # Prevent CPU overuse

    def _handle_location_update(self, message):
        """Process location updates"""
        try:
            from_id = message['from_id']
            position = message['data'].get('position', {})
            
            with self.node_lock:
                if from_id in self.nodes:
                    self.nodes[from_id]['position'] = position
                    self.nodes[from_id]['last_seen'] = message['timestamp']
            
            # Update database
            from models import User
            user = User.query.filter_by(mesh_id=from_id).first()
            if user:
                user.last_location = f"{position.get('lat', 0)},{position.get('lon', 0)}"
                user.last_seen = message['timestamp']
                self.db.session.commit()
                
        except Exception as e:
            logger.error(f"Error handling location update: {e}")

    def _handle_status_update(self, message):
        """Process status updates"""
        try:
            data = message['data']
            from_id = message['from_id']
            
            with self.node_lock:
                if from_id in self.nodes:
                    self.nodes[from_id]['status'] = data.get('status', '')
                    self.nodes[from_id]['battery'] = data.get('battery', 0)
                    self.nodes[from_id]['last_seen'] = message['timestamp']
            
        except Exception as e:
            logger.error(f"Error handling status update: {e}")

    def _handle_text_message(self, message):
        """Process text messages"""
        try:
            from_id = message['from_id']
            content = message['data'].get('content', '')
            
            # Store message in database
            from models import Message
            new_message = Message(
                content=content,
                sender_id=from_id,
                timestamp=message['timestamp']
            )
            self.db.session.add(new_message)
            self.db.session.commit()
            
        except Exception as e:
            logger.error(f"Error handling text message: {e}")

    def _handle_emergency(self, message):
        """Process emergency alerts"""
        try:
            from_id = message['from_id']
            alert_type = message['data'].get('alert_type', 'general')
            position = message['data'].get('position', {})
            
            # Update node status
            with self.node_lock:
                if from_id in self.nodes:
                    self.nodes[from_id]['emergency'] = {
                        'type': alert_type,
                        'position': position,
                        'timestamp': message['timestamp']
                    }
            
            # Broadcast emergency to all nodes
            self.broadcast_message({
                'type': 'emergency_broadcast',
                'from_id': from_id,
                'alert_type': alert_type,
                'position': position,
                'timestamp': message['timestamp'].isoformat()
            })
            
        except Exception as e:
            logger.error(f"Error handling emergency: {e}")

    def broadcast_message(self, message):
        """Send message to all nodes"""
        if not self.connected:
            logger.error("Not connected to Meshtastic device")
            return False
        
        try:
            self.interface.sendText(json.dumps(message))
            return True
        except Exception as e:
            logger.error(f"Error broadcasting message: {e}")
            return False

    def send_message(self, to_id, message):
        """Send message to specific node"""
        if not self.connected:
            logger.error("Not connected to Meshtastic device")
            return False
        
        try:
            self.interface.sendText(json.dumps(message), destinationId=to_id)
            return True
        except Exception as e:
            logger.error(f"Error sending message: {e}")
            return False

    def get_nodes(self):
        """Get list of all known nodes"""
        with self.node_lock:
            return list(self.nodes.values())

    def get_node(self, node_id):
        """Get specific node information"""
        with self.node_lock:
            return self.nodes.get(node_id)
