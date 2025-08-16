import os
from dotenv import load_dotenv
from langchain_community.llms import Ollama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from flask import Flask, request, render_template


llm_app = Flask(__name__)

#
def initialize_chatbot():
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "Provide response to the user queries"),
            ("user", "Prompt: {query}")
        ]
    )
    
    llm = Ollama=(model="tinyllama:1.1b-chat-v1-q4_0")  #      (model="llama3.2:latest")
    output_parser = StrOutputParser()
    
    chain = prompt | llm | output_parser
    return chain

# Initialize chatbot
chain = initialize_chatbot()

@llm_app.route('/ai', methods=['POST'])
def home():
   
    request_data = request.get_json()
    output = chain.invoke({'query': request_data['Prompt']})
   
    answer= {"Prompt": request_data["Prompt"],
             "Response":output}
    
    print(answer["Prompt"])
    print(output)
    print("----------")
    print(answer["Response"])
    
      
    # both return outputs work
    return answer  
    # return output, 200, answer 

if __name__ == '__main__':
    llm_app.run(debug=True, port = 5001)




