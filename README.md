# AWS E-Commerce app

This is a E-Commerce api project for TypeScript development with CDK. Project made following course https://www.udemy.com/course/aws-serverless-nodejs-cdk-pt

The `cdk.json` file tells the CDK Toolkit how to execute your app.


## Installation & deploy

- Clone or download repositoy zip

- Make the `.env` file and complete it

  ```bash
    cp .env.example .env
  ```

- Boostrap with cdk

  ```bash
    cdk bootstrap
  ```

- Deploy lambda

  ```bash
    cdk deploy --all
    ```
      

## API Reference

- #### Create product

  ```http
    POST {aws_lambda_url}/products
  ```

  ##### Request body:

  ```json
  {
    productName: string;
    code: string;
    price: number;
    model: string;
    productUrl: string;
  }
  ```

- #### Get all products

  ```http
    GET {aws_lambda_url}/products
  ```


- #### Get individual product by id

  ```http
    GET {aws_lambda_url}/products/${id}
  ```

  | Parameter | Type     | Description                       |
  | :-------- | :------- | :-------------------------------- |
  | `id`      | `string` | **Required**. Id of product to fetch |


- #### Update product by id

  ```http
    PUT {aws_lambda_url}/products/${id}
  ```

  | Parameter | Type     | Description                       |
  | :-------- | :------- | :-------------------------------- |
  | `id`      | `string` | **Required**. Id of product to update |

  ##### Request body:

  ```json
  {
    productName: string;
    code: string;
    price: number;
    model: string;
    productUrl: string;
  }
  ```

- #### Delete product by id

  ```http
    DELETE {aws_lambda_url}/products/${id}
  ```

  | Parameter | Type     | Description                       |
  | :-------- | :------- | :-------------------------------- |
  | `id`      | `string` | **Required**. Id of product to delete |

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
