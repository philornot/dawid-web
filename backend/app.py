from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import re
import random
import math
from datetime import datetime
from pathlib import Path
import logging
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional
from enum import Enum

class ConversationState(Enum):
    NORMAL = "normal"
    LEARNING = "learning"
    CALCULATING = "calculating"

class ESFJPersonality:
    GREETING_TEMPLATES = [
        "Hej! 😊",
        "Cześć!",
        "Dzień dobry! 👋",
        "Siema!",
        "Witaj! ✨",
        "Co słychać? 😊"
    ]
    
    LEARNING_TEMPLATES = [
        "Nie wiem, nauczysz mnie? 🤔",
        "Pierwsze słyszę! Co to?",
        "Opowiesz mi o tym? 😊",
        "A co to takiego?",
        "Nie znam tego jeszcze!",
        "Wyjaśnisz? 🤗"
    ]
    
    GRATITUDE_TEMPLATES = [
        "Dzięki! 💖",
        "Super, że mi powiedziałeś!",
        "O, fajnie! 😊",
        "Świetnie! Zapamiętam!",
        "Dzięki za wyjaśnienie! ✨",
        "Ekstra! 🌟"
    ]

    @staticmethod
    def get_greeting() -> str:
        return random.choice(ESFJPersonality.GREETING_TEMPLATES)

    @staticmethod
    def get_learning_request() -> str:
        return random.choice(ESFJPersonality.LEARNING_TEMPLATES)

    @staticmethod
    def get_gratitude() -> str:
        return random.choice(ESFJPersonality.GRATITUDE_TEMPLATES)

class MathProcessor:
    def __init__(self):
        self.operations = {
            '+': lambda x, y: x + y,
            '-': lambda x, y: x - y,
            '*': lambda x, y: x * y,
            '/': lambda x, y: x / y,
            '^': lambda x, y: x ** y,
            'sqrt': lambda x: math.sqrt(x)
        }
        self.precedence = {'+': 1, '-': 1, '*': 2, '/': 2, '^': 3}

    def evaluate(self, expression: str) -> Optional[float]:
        try:
            tokens = self._tokenize(expression)
            if not tokens:
                return None
            result = self._evaluate_tokens(tokens)
            return round(float(result), 4)
        except:
            return None

    def _tokenize(self, expression: str) -> List[str]:
        expression = expression.replace(' ', '')
        tokens = []
        i = 0
        while i < len(expression):
            if expression[i].isdigit() or expression[i] == '.':
                num = ''
                while i < len(expression) and (expression[i].isdigit() or expression[i] == '.'):
                    num += expression[i]
                    i += 1
                tokens.append(num)
                i -= 1
            elif expression[i] in '+-*/^()':
                tokens.append(expression[i])
            i += 1
        return tokens

    def _evaluate_tokens(self, tokens: List[str]) -> float:
        values = []
        operators = []

        for token in tokens:
            if self._is_number(token):
                values.append(float(token))
            elif token == '(':
                operators.append(token)
            elif token == ')':
                while operators and operators[-1] != '(':
                    self._apply_operator(operators, values)
                operators.pop()
            else:
                while (operators and operators[-1] != '(' and
                       self.precedence.get(operators[-1], 0) >= self.precedence.get(token, 0)):
                    self._apply_operator(operators, values)
                operators.append(token)

        while operators:
            self._apply_operator(operators, values)

        return values[0]

    def _is_number(self, token: str) -> bool:
        try:
            float(token)
            return True
        except ValueError:
            return False

    def _apply_operator(self, operators: List[str], values: List[float]):
        operator = operators.pop()
        if operator in self.operations:
            b = values.pop()
            a = values.pop()
            values.append(self.operations[operator](a, b))

class DawidAI:
    def __init__(self, data_file: str = "dawid_data.json"):
        self.personality = ESFJPersonality()
        self.math_processor = MathProcessor()
        self.data_file = Path(data_file)
        self.knowledge_base: Dict[str, List[str]] = {}
        self.state = ConversationState.NORMAL
        self.last_question: Optional[str] = None
        self.load_knowledge()
        self.setup_logging()

    def setup_logging(self):
        logging.basicConfig(
            filename='dawid.log',
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )

    def load_knowledge(self):
        if self.data_file.exists():
            try:
                with open(self.data_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.knowledge_base = data.get('knowledge_base', {})
            except Exception as e:
                logging.error(f"Błąd podczas ładowania wiedzy: {e}")
                print("Wystąpił błąd podczas ładowania wiedzy. Zaczynam od nowa!")

    def save_knowledge(self):
        try:
            data = {
                'knowledge_base': self.knowledge_base,
            }
            with open(self.data_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logging.error(f"Błąd podczas zapisywania wiedzy: {e}")

    def process_message(self, message: str) -> dict:
        """Przetwarza wiadomość i zwraca odpowiedź wraz ze stanem"""
        if self.state == ConversationState.LEARNING:
            if message.lower() == 'skip':
                self.state = ConversationState.NORMAL
                return {
                    'response': "Okej, nie ma sprawy! 😊",
                    'state': 'normal'
                }
            
            self._learn(self.last_question, message)
            self.state = ConversationState.NORMAL
            return {
                'response': self.personality.get_gratitude(),
                'state': 'normal'
            }

        math_match = re.search(r'(policz|oblicz)\s*([\d\+\-\*/\(\)\^\s]+)', message.lower())
        if math_match:
            expression = math_match.group(2)
            result = self.math_processor.evaluate(expression)
            if result is not None:
                return {
                    'response': f"Wynik działania {expression} = {result} 📊",
                    'state': 'normal'
                }
            return {
                'response': "Przepraszam, ale nie mogę wykonać tego działania 😅",
                'state': 'normal'
            }

        response = self._get_response(message)
        if response:
            return {
                'response': response,
                'state': 'normal'
            }

        self.state = ConversationState.LEARNING
        self.last_question = message
        return {
            'response': self.personality.get_learning_request(),
            'state': 'learning'
        }

    def _learn(self, question: str, answer: str):
        cleaned_question = re.sub(r'[^\w\s]', '', question.lower()).strip()
        
        if cleaned_question in self.knowledge_base:
            if answer not in self.knowledge_base[cleaned_question]:
                self.knowledge_base[cleaned_question].append(answer)
        else:
            self.knowledge_base[cleaned_question] = [answer]
            
        self.save_knowledge()
        logging.info(f"Nauczona odpowiedź: {cleaned_question} -> {answer}")

    def _get_response(self, question: str) -> Optional[str]:
        cleaned_question = re.sub(r'[^\w\s]', '', question.lower()).strip()
        
        for stored_question, answers in self.knowledge_base.items():
            cleaned_stored = re.sub(r'[^\w\s]', '', stored_question.lower()).strip()
            if cleaned_question == cleaned_stored:
                response = random.choice(answers)
                self.save_knowledge()
                return response
        
        return None

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:5173",
            "https://jestem-dawid.netlify.app",
            "http://192.168.1.144",
            "http://172.17.0.1",
            "http://100.113.203.25"
        ]
    }
})
# Inicjalizacja Dawida jako globalnej zmiennej
dawid = DawidAI()

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message', '')
    
    if not message:
        return jsonify({'response': 'Nie otrzymałem wiadomości... 😕', 'state': 'normal'})

    result = dawid.process_message(message)
    return jsonify(result)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)