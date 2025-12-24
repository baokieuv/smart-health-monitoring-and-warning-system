class ResponseUtil {
    static success(res, data = null, message = 'Success', statusCode = 200){
        return res.status(statusCode).json({
            status: 'success',
            message,
            data
        });
    }

    static error(res, message = 'Error', statusCode = 500, errors = null){
        const response = {
            status: 'error',
            message
        };

        if(errors){
            response.errors = errors;
        }
        return res.status(statusCode).json(response);
    }

    static paginate(res, data, page, limit, total, message = 'Data retrieved successfully') {
        const totalPages = Math.ceil(total / limit) || 1;
        
        return res.status(200).json({
            status: 'success',
            message,
            data: {
                items: data,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages
                }
            }
        });
    }

    static created(res, data = null, message = 'Resource created successfully') {
        return this.success(res, data, message, 201);
    }

    static noContent(res) {
        return res.status(204).send();
    }
}

module.exports = ResponseUtil;