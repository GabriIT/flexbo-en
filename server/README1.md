# Promptq

A REST API written in Go, designed to bridge private AI models with clients requests.

In scenarios where it is not desired to publically expose the server running the AI models, such as in a private local computer, Promptq creates a bridge allowing the AI server to remain private by querying and submitting responses to prompts through GET and POST requests.

## Running
```
$ go run cmd/main.go
```

## Testing
```
$ go test ./pkg/...
$ go test -v ./pkg/...
```

## Troubleshooting

If you receive a database ping error like this one:
```
Database ping failed with: pq: SSL is not enabled on the server exit status 1
```

Consider adding `?sslmode=disable` at the end of your DB URL.
See this [stackoverflow post](https://stackoverflow.com/questions/21959148/ssl-is-not-enabled-on-the-server) for more details.

## Notes to self
* Handle case where email is taken but has not been confirmed
* Fatal logs are stopping the API, fix this.
    * Possibly use right router, which uses the middleware to handle errors
* Database tests currently have concurrency issues, they share the same database.
* I should add an idle timeout in addition to the existing abosulte timeout.
    * I would need to keep track of user activity and update the timeout accordingly. Maybe through a last interaction column in the users table.
* Possibly index common columns such as email.