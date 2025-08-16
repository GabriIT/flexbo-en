import random
import requests
import time

# from langchain_community.llms import Ollama
# from langchain_core.prompts import ChatPromptTemplate
# from langchain_core.output_parsers import StrOutputParser

# def initialize_chatbot():
#     prompt = ChatPromptTemplate.from_messages(
#         [
#             ("system", "Provide response to the user queries"),
#             ("user", "Question: {Question}"),
#         ]
#     )

#     llm = Ollama(model="llama3.1")
#     output_parser = StrOutputParser()

#     chain = prompt | llm | output_parser
#     return chain


# def ai_answer(question: str) -> str:
#     # return chain.invoke({"Question": messages[-1]["content"]})
#     return f"Answer to the question \"{question}\" is {random.randint(0, 10)}."
    
def get_llm_response(prompt: str):
    # time.sleep(10)
    url = f'http://localhost:5001/ai'  # URL of the 'ai' app
   
    print(f"{prompt}")   
    
    
    response = requests.post(url, json={"Prompt": prompt})    
    answer = response.json()
    # return answer
    return answer["Response"]




def main():
    # Initialize chatbot
    # chain = initialize_chatbot()

    while True:
        response = requests.get(
            "http://localhost/api/thread/pending",
            # "http://app.athenalabo.com/api/thread/pending",
            headers={"X-API-KEY": "secret"},
        )
        response.raise_for_status()

        threads = response.json()
        if threads is None:
            print("No threads pending...")
            continue

        print(f"Answering {len(threads)}...")

        for thread in threads:
            print(f"Answering thread {thread['id']}...")

            response = requests.get(
                f"http://localhost/api/thread/{thread['id']}/prompt/messages",
                # f"http://app.athenalabo.com/api/thread/{thread['id']}/prompt/messages",
                headers={"X-API-KEY": "secret"},
            )
            response.raise_for_status()

            messages = response.json()["messages"]
            # answer = ai_answer(messages[-1]["content"])

            answer = get_llm_response(messages[-1]["content"])
            print(answer)
            
            
            response = requests.post(
                f"http://localhost/api/thread/{thread['id']}/prompt/answer",
                # f"http://app.athenalabo.com/api/thread/{thread['id']}/prompt/answer",
                json={"content": answer},
                headers={"X-API-KEY": "secret"},
            )
            response.raise_for_status()
            # print(response["content"])
        time.sleep(5)


if __name__ == '__main__':
    main()