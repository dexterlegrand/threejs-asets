import React from 'react';
import './chatbot.css';
import api from './api.js';
import logo from '../../assets/AsetsLuxLogo.JPG';

class Chatbot extends React.Component {
  constructor(props) {
    super(props);
    const theme = localStorage.getItem('theme') || 'light';
    this.state = {
        messages: [],
        input: '',
        isChatbotOpen: false,
        theme: theme
    };
  }

  handleChange = (event) => {
    this.setState({ input: event.target.value });
  }
  addWelcomeMessage = () => {
    this.setState(state => ({
      messages: [...state.messages, { text: 'Welcome, how can I be of any help?', sender: 'bot' }]
    }));
  }
  addShortcutMessage = () => {
    this.setState(state => ({
      messages: [...state.messages, { text: 'You can use the following shortcuts in IDS:', sender: 'bot', highlight: true },
      { text: 'Select an equipment/pipe element/structure element : Double click ', sender: 'bot', highlight: true },
      { text: 'Select a connection nozzle of the equipment: Ctrl + click', sender: 'bot', highlight: true },
      { text: 'Select the nozzle starting point on the equipment: Ctrl + click', sender: 'bot', highlight: true },
      { text: 'Add pipe elements on the suggested yellow bubble: Ctrl + click', sender: 'bot',highlight: true },
      { text: 'Add connections on the suggested yellow bubble: Ctrl + click', sender: 'bot', highlight: true },
      { text: 'Move the grid: Ctrl + drag', sender: 'bot', highlight: true },
      { text: 'Move the equipment: Shift+drag ', sender: 'bot', highlight: true },
      { text: 'Search for the lines in the piping module: Ctrl+Shift+S ', sender: 'bot', highlight: true },
      { text: 'Search for the structure elements in the structure module: Ctrl+Shift+S ', sender: 'bot', highlight: true },
      { text: 'Change focal pivot point (on a particular equipment): Ctrl+shift+click ', sender: 'bot', highlight: true }]
    }));
  }

  handleSubmit = async (event) => {
    event.preventDefault();
    const userInput = this.state.input;

    this.setState((state) => ({
      messages: [...state.messages, { text: userInput, sender: 'user' }],
      input: ''
    }));

    try {
      const response = await api.post('/ask', { question: userInput });
      const botResponse = response.data.response.response;

      this.setState((state) => ({
        messages: [...state.messages, { text: botResponse, sender: 'bot' }]
      }));
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
  toggleChatbotWindow = () => {
    this.setState((prevState) => ({
      isChatbotOpen: !prevState.isChatbotOpen,
      messages: !prevState.isChatbotOpen ? prevState.messages : [],
    }));
    if (!this.state.isChatbotOpen) { 
      this.addWelcomeMessage();
    }
  }
  toggleTheme = () => {
    const newTheme = this.state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    this.setState({ theme: newTheme });
  }
  

  render() {
    const { theme, isChatbotOpen } = this.state;
    return (
        <div className={`chatbot-container ${theme}`}>
            {!isChatbotOpen && (
            <div className="chatbot-floating-button" onClick={this.toggleChatbotWindow}>
                <div className="logo-container">
                    <img src={logo} alt='Logo' className="logo"/>
                </div>
            </div>
            )}
            {isChatbotOpen && (
            <div className="chatbot-window">
                <div className="chatbot-header">
                    <div className="header-content">
                        <img src={logo} alt='Logo' style={{ width: '50px', marginRight: '10px' }}/>
                        IDS <span>™</span> Bot
                        </div>
                        <div className="button-container">
                            <button onClick={this.toggleChatbotWindow} className="button">Close</button>
                            {/*<button onClick={this.toggleTheme} className="button">
                                {this.state.theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                            </button>*/}
                            <button onClick={this.addShortcutMessage} className="button">Shortcuts</button>
                        </div>
                    </div>
                    <div className="chatbot-messages">
                      {this.state.messages.map((message, index) => (
                        <div key={index} className={`chatbot-message ${message.sender}-message ${message.highlight ? 'highlighted' : ''}`}>
                          <p>{message.text}</p>
                        </div>
                      ))}
                    </div>
                    <div className="chatbot-input-area">
                        <form onSubmit={this.handleSubmit}>
                            <input
                            className="chatbot-input"
                            type="text"
                            placeholder="Ask your Query..."
                            value={this.state.input}
                            onChange={this.handleChange}
                            />
                            <button className="chatbot-send-button" type="submit">Send</button>
                        </form>
                    </div>
                </div>
            )}
        </div>        
    );
  }
}

export default Chatbot;