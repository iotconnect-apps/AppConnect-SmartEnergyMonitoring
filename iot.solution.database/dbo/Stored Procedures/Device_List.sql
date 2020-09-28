/*******************************************************************
DECLARE @count INT
     	,@output INT = 0
		,@fieldName	VARCHAR(255)

EXEC [dbo].[Device_List]
	 @companyGuid	= '895019CF-1D3E-420C-828F-8971253E5784'
	,@parentEntityGuid	= '895019CF-1D3E-420C-828F-8971253E5784'
	,@entityGuid	= '895019CF-1D3E-420C-828F-8971253E5784'
	,@pageSize		= 10
	,@pageNumber	= 1
	,@orderby		= NULL
	,@count			= @count OUTPUT
	,@invokingUser  = 'C1596B8C-7065-4D63-BFD0-4B835B93DFF2'
	,@version		= 'v1'
	,@output		= @output	OUTPUT
	,@fieldName		= @fieldName	OUTPUT

SELECT @count count, @output status, @fieldName fieldName

001	SEM-39 03-07-2020 [Nishit Khakhi]	Added Initial Version to List Device
*******************************************************************/
CREATE PROCEDURE [dbo].[Device_List]
(	@companyGuid		UNIQUEIDENTIFIER
	,@parentEntityGuid	UNIQUEIDENTIFIER	= NULL
	,@entityGuid		UNIQUEIDENTIFIER	= NULL
	,@search			VARCHAR(100)		= NULL
	,@pageSize			INT
	,@pageNumber		INT
	,@orderby			VARCHAR(100)		= NULL
	,@invokingUser		UNIQUEIDENTIFIER
	,@version			VARCHAR(10)
	,@culture			VARCHAR(10)			= 'en-Us'
	,@output			SMALLINT			OUTPUT
	,@fieldName			VARCHAR(255)		OUTPUT
	,@count				INT OUTPUT
	,@enableDebugInfo		CHAR(1)			= '0'
)
AS
BEGIN
   SET NOCOUNT ON

    IF (@enableDebugInfo = 1)
	BEGIN
        DECLARE @Param XML
        SELECT @Param =
        (
            SELECT 'Device_List' AS '@procName'
            	, CONVERT(VARCHAR(MAX),@companyGuid) AS '@companyGuid'
				, CONVERT(VARCHAR(MAX),@parentEntityGuid) AS '@parentEntityGuid'
				, CONVERT(VARCHAR(MAX),@entityGuid) AS '@entityGuid'
            	, CONVERT(VARCHAR(MAX),@search) AS '@search'
				, CONVERT(VARCHAR(MAX),@pageSize) AS '@pageSize'
				, CONVERT(VARCHAR(MAX),@pageNumber) AS '@pageNumber'
				, CONVERT(VARCHAR(MAX),@orderby) AS '@orderby'
				, CONVERT(VARCHAR(MAX),@version) AS '@version'
            	, CONVERT(VARCHAR(MAX),@invokingUser) AS '@invokingUser'
            FOR XML PATH('Params')
	    )
	    INSERT INTO DebugInfo(data, dt) VALUES(Convert(VARCHAR(MAX), @Param), GETDATE())
    END
    
    BEGIN TRY

		SELECT
		 @output = 1
		,@count = -1

		IF OBJECT_ID('tempdb..#temp_Device') IS NOT NULL DROP TABLE #temp_Device

		CREATE TABLE #temp_Device
		(	[guid]				UNIQUEIDENTIFIER
			,[companyGuid]		UNIQUEIDENTIFIER
			,[entityGuid]		UNIQUEIDENTIFIER
			,[entityName]		NVARCHAR(500)
			,[subEntityName]		NVARCHAR(500)
			,[templateGuid]		UNIQUEIDENTIFIER
			,[parentDeviceGuid]	UNIQUEIDENTIFIER
			,[typeGuid]			UNIQUEIDENTIFIER
			,[uniqueId]			NVARCHAR(500)
			,[name]				NVARCHAR(500)
			,[note]				NVARCHAR(1000)
			,[tag]				NVARCHAR(50)
			,[image]			NVARCHAR(200)
			,[isProvisioned]	BIT
			,[isActive]			BIT
			,[totalAlert]		BIGINT
			,[status]			NVARCHAR(100)
			,[currentEnergy]	DECIMAL(18,2)
			,[rowNum]			INT
		)

		IF LEN(ISNULL(@orderby, '')) = 0
		SET @orderby = 'name asc'

		DECLARE @Sql nvarchar(MAX) = ''

		SET @Sql = '
		SELECT
			*
			,ROW_NUMBER() OVER (ORDER BY '+@orderby+') AS rowNum
		FROM
		( SELECT
			D.[guid]
			, D.[companyGuid]
			, D.[entityGuid]
			, EP.[name] AS [entityName]
			, G.[name] AS [subEntityName]
			, D.[templateGuid]
			, D.[parentDeviceGuid]
			, D.[typeGuid]
			, D.[uniqueId]
			, D.[name]
			, D.[note]
			, D.[tag]
			, D.[image]
			, D.[isProvisioned]
			, D.[isActive]
			, 0 AS [count]
			, '''' AS [status]
			, 0 AS [currentEnergy]
			FROM [dbo].[Device] D WITH (NOLOCK) 
			INNER JOIN [dbo].[Entity] G WITH (NOLOCK) ON D.[entityGuid] = G.[guid] AND G.[isDeleted] = 0
			LEFT JOIN [dbo].[Entity] EP WITH (NOLOCK) ON G.[parentEntityGuid] = EP.[guid] AND EP.[isDeleted] = 0 
			 WHERE D.[companyGuid]=@companyGuid AND D.[isDeleted]=0 '
			+ CASE WHEN @parentEntityGuid IS NOT NULL THEN ' AND G.[parentEntityGuid] = @parentEntityGuid ' ELSE ' ' END +
			+ CASE WHEN @entityGuid IS NOT NULL THEN ' AND G.[guid] = @entityGuid ' ELSE ' ' END +
				+ CASE WHEN @search IS NULL THEN '' ELSE
			' AND (D.name LIKE ''%' + @search + '%''
			  OR D.[uniqueId] LIKE ''%' + @search + '%'' 
			  OR G.[name] LIKE ''%' + @search + '%'' 
			  OR EP.[name] LIKE ''%' + @search + '%'' 
			)'
			 END +
		' )  data '
		
		INSERT INTO #temp_Device
		EXEC sp_executesql 
			  @Sql
			, N'@orderby VARCHAR(100), @companyGuid UNIQUEIDENTIFIER, @parentEntityGuid UNIQUEIDENTIFIER, @entityGuid UNIQUEIDENTIFIER '
			, @orderby		= @orderby			
			, @companyGuid	= @companyGuid	
			, @parentEntityGuid = @parentEntityGuid
			, @entityGuid = @entityGuid
			
		SET @count = @@ROWCOUNT

		;WITH CTEDATA
			AS 
			(	SELECT t.[Guid],COUNT(A.[guid]) [totalAlert] FROM [IOTConnectAlert] A
				INNER JOIN #temp_Device t ON A.[deviceGuid] = t.[Guid]
				GROUP BY t.[Guid]
			)
			, CTE_DeviceStatus
			AS (	SELECT D.[guid]
						, CASE WHEN CONVERT(TINYINT,I.[attributeValue]) = 1 THEN 'On' Else 'Off' END AS [status]
						, ROW_NUMBER () OVER (PARTITION BY I.[uniqueId],I.[localName] ORDER BY I.[createdDate] DESC) AS [no]
					FROM #temp_Device D 
					LEFT JOIN [IOTConnect].[AttributeValue] I (NOLOCK)  ON D.[companyGuid] = I.[companyGuid] AND D.[uniqueId] = I.[uniqueId]
					WHERE I.[localName] = 'status'
			)
			, CTE_DeviceEnergy
			AS (	SELECT D.[guid]
						, CONVERT(DECIMAL(18,2),I.[attributeValue]) AS [attributeValue]
						, ROW_NUMBER () OVER (PARTITION BY I.[uniqueId],I.[localName] ORDER BY I.[createdDate] DESC) AS [no]
					FROM #temp_Device D 
					LEFT JOIN [IOTConnect].[AttributeValue] I (NOLOCK)  ON D.[companyGuid] = I.[companyGuid] AND D.[uniqueId] = I.[uniqueId]
					WHERE I.[localName] = 'currentin'
			)
			UPDATE t
			SET [totalAlert] = ISNULL(c.[totalAlert],0)
				, [status] = ISNULL(CD.[status],'')
				, [currentEnergy] = ISNULL(CE.[attributeValue],0)
			FROM #temp_Device t 
			LEFT JOIN CTEDATA c ON t.[guid] = c.[Guid]
			LEFT JOIN CTE_DeviceStatus CD ON t.[guid] = CD.[guid] AND CD.[no] = 1
			LEFT JOIN CTE_DeviceEnergy CE ON t.[guid] = CE.[guid] AND CE.[no] = 1

		IF(@pageSize <> -1 AND @pageNumber <> -1)
			BEGIN
				SELECT 
					D.[guid]
					, D.[companyGuid]
					, D.[entityGuid]
					, D.[entityName]
					, D.[subEntityName]
					, D.[templateGuid]
					, D.[parentDeviceGuid]
					, D.[typeGuid]
					, D.[uniqueId]
					, D.[name]
					, D.[note]
					, D.[tag]
					, D.[image]
					, D.[isProvisioned]
					, D.[isActive]	
					, D.[totalAlert]	
					, D.[status]
					, D.[currentEnergy]
				FROM #temp_Device D
				WHERE rowNum BETWEEN ((@pageNumber - 1) * @pageSize) + 1 AND (@pageSize * @pageNumber)			
			END
		ELSE
			BEGIN
				SELECT 
					D.[guid]
					, D.[companyGuid]
					, D.[entityGuid]
					, D.[entityName]
					, D.[subEntityName]
					, D.[templateGuid]
					, D.[parentDeviceGuid]
					, D.[typeGuid]
					, D.[uniqueId]
					, D.[name]
					, D.[note]
					, D.[tag]
					, D.[image]
					, D.[isProvisioned]
					, D.[isActive]		
					, D.[totalAlert]				
					, D.[status]
					, D.[currentEnergy]
				FROM #temp_Device D
			END
	   
        SET @output = 1
		SET @fieldName = 'Success'
	END TRY	
	BEGIN CATCH	
		DECLARE @errorReturnMessage VARCHAR(MAX)

		SET @output = 0

		SELECT @errorReturnMessage = 
			ISNULL(@errorReturnMessage, '') +  SPACE(1)   + 
			'ErrorNumber:'  + ISNULL(CAST(ERROR_NUMBER() as VARCHAR), '')  + 
			'ErrorSeverity:'  + ISNULL(CAST(ERROR_SEVERITY() as VARCHAR), '') + 
			'ErrorState:'  + ISNULL(CAST(ERROR_STATE() as VARCHAR), '') + 
			'ErrorLine:'  + ISNULL(CAST(ERROR_LINE () as VARCHAR), '') + 
			'ErrorProcedure:'  + ISNULL(CAST(ERROR_PROCEDURE() as VARCHAR), '') + 
			'ErrorMessage:'  + ISNULL(CAST(ERROR_MESSAGE() as VARCHAR(max)), '')
		RAISERROR (@errorReturnMessage, 11, 1)  
 
		IF (XACT_STATE()) = -1  
		BEGIN   
			ROLLBACK TRANSACTION 
		END   
		IF (XACT_STATE()) = 1  
		BEGIN      
			ROLLBACK TRANSACTION  
		END   
		RAISERROR (@errorReturnMessage, 11, 1)   
	END CATCH
END