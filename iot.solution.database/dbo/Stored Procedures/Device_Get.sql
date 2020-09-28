
/*******************************************************************
DECLARE @count INT
     ,@output INT = 0
	,@fieldName				nvarchar(255)
EXEC [dbo].[Device_Get]
	 @guid				= 'E9F77DD4-78BC-4461-9D00-64D927998ABE'	
	,@companyGuid		= '895019CF-1D3E-420C-828F-8971253E5784'	
	,@invokingUser  	= '7D31E738-5E24-4EA2-AAEF-47BB0F3CCD41'
	,@version			= 'v1'
	,@output			= @output		OUTPUT
	,@fieldName			= @fieldName	OUTPUT	
               
 SELECT @output status,  @fieldName AS fieldName    
 
 001 SEM-4 30-06-2020 [Nishit Khakhi]	Added Initial Version to Get Device Information
*******************************************************************/

CREATE PROCEDURE [dbo].[Device_Get]
(	 
	 @guid				UNIQUEIDENTIFIER	
	,@companyGuid		UNIQUEIDENTIFIER
	,@invokingUser		UNIQUEIDENTIFIER
	,@version			NVARCHAR(10)
	,@output			SMALLINT		  OUTPUT
	,@fieldName			NVARCHAR(255)	  OUTPUT	
	,@culture			NVARCHAR(10)	  = 'en-Us'
	,@enableDebugInfo	CHAR(1)			  = '0'
)
AS
BEGIN
    SET NOCOUNT ON
	DECLARE @orderBy VARCHAR(10)
    IF (@enableDebugInfo = 1)
	BEGIN
        DECLARE @Param XML
        SELECT @Param =
        (
            SELECT 'Device_Get' AS '@procName'
			, CONVERT(nvarchar(MAX),@guid) AS '@guid'			
			, CONVERT(nvarchar(MAX),@companyGuid) AS '@companyGuid'
            , CONVERT(nvarchar(MAX),@invokingUser) AS '@invokingUser'
			, CONVERT(nvarchar(MAX),@version) AS '@version'
			, CONVERT(nvarchar(MAX),@output) AS '@output'
            , CONVERT(nvarchar(MAX),@fieldName) AS '@fieldName'
            FOR XML PATH('Params')
	    )
	    INSERT INTO DebugInfo(data, dt) VALUES(Convert(nvarchar(MAX), @Param), GETUTCDATE())
    END
    Set @output = 1
    SET @fieldName = 'Success'

    IF NOT EXISTS (SELECT TOP 1 1 FROM [dbo].[Device] (NOLOCK) WHERE [companyGuid]=@companyGuid AND [guid]=@guid AND [isDeleted]=0)
	BEGIN
		Set @output = -3
		SET @fieldName = 'DeviceNotFound'
		RETURN;
	END
  
    BEGIN TRY
		;WITH CTE_Consumption
		AS (	SELECT D.[guid], SUM(T.[sum]) AS [totalConsumption] FROM TelemetrySummary_Hourwise T (NOLOCK)
				INNER JOIN [dbo].[Device] D (NOLOCK) ON T.[deviceGuid] = D.[guid] AND D.[isDeleted] = 0
				WHERE D.[entityGuid] = @guid AND [attribute] = 'currentin'
				GROUP BY D.[guid]
			)
		, CTE_DeviceStatus
		AS (	SELECT D.[guid]
					, CASE WHEN CONVERT(TINYINT,I.[attributeValue]) = 1 THEN 'On' Else 'Off' END AS [status]
					, ROW_NUMBER () OVER (PARTITION BY I.[uniqueId],I.[localName] ORDER BY I.[createdDate] DESC) AS [no]
				FROM [dbo].[Device] D (NOLOCK)
				LEFT JOIN [IOTConnect].[AttributeValue] I (NOLOCK)  
					ON D.[companyGuid] = I.[companyGuid] AND D.[uniqueId] = I.[uniqueId]
					WHERE I.[localName] = 'status'
		)
		, CTE_DeviceEnergy
		AS (	SELECT D.[guid]
					, I.[attributeValue] as [attributeValue]
					, ROW_NUMBER () OVER (PARTITION BY I.[uniqueId],I.[localName] ORDER BY I.[createdDate] DESC) AS [no]
				FROM [dbo].[Device] D (NOLOCK)
				LEFT JOIN [IOTConnect].[AttributeValue] I (NOLOCK) ON D.[companyGuid] = I.[companyGuid] AND D.[uniqueId] = I.[uniqueId]
				WHERE I.[localName] = 'currentin'
		)
		, CTE_DeviceVoltage
		AS (	SELECT D.[guid]
					, I.[attributeValue] as [attributeValue]
					, ROW_NUMBER () OVER (PARTITION BY I.[uniqueId],I.[localName] ORDER BY I.[createdDate] DESC) AS [no]
				FROM [dbo].[Device] D (NOLOCK)
				LEFT JOIN [IOTConnect].[AttributeValue] I (NOLOCK) ON D.[companyGuid] = I.[companyGuid] AND D.[uniqueId] = I.[uniqueId]
				WHERE I.[localName] = 'voltage'
		)
		SELECT D.[guid]
				,D.[companyGuid]
				,D.[entityGuid]
				,E.[name] AS [entityName]
				,D.[templateGuid]
				,D.[parentDeviceGuid]
				,D.[typeGuid]
				,D.[uniqueId]
				,D.[name]
				,D.[note]
				,D.[tag]
				,D.[image]
				,D.[isProvisioned]
				,D.[isActive]
				,D.[createdDate]
				,D.[createdBy]
				,D.[updatedDate]
				,D.[updatedBy]
				, DS.[status]
				, Cons.[totalConsumption]
				, DE.[attributeValue] as [currentReading]
				, DV.[attributeValue] as [voltageReading]
		FROM [dbo].[Device] D (NOLOCK) 
		INNER JOIN [dbo].[Entity] E (NOLOCK) ON D.[entityGuid] = E.[guid] AND E.[isDeleted] = 0
		LEFT JOIN CTE_Consumption Cons (NOLOCK) ON D.[guid]=Cons.[guid]
		LEFT JOIN CTE_DeviceStatus DS ON D.[guid] = DS.[guid] AND DS.[no] = 1
		LEFT JOIN CTE_DeviceEnergy DE ON D.[guid] = DE.[guid] AND DE.[no] = 1
		LEFT JOIN CTE_DeviceVoltage DV ON D.[guid] = DV.[guid] AND DV.[no] = 1
		WHERE D.[companyGuid]=@companyGuid AND D.[guid]=@guid AND D.[isDeleted]=0


	END TRY
	BEGIN CATCH
		DECLARE @errorReturnMessage nvarchar(MAX)

		SET @output = 0

		SELECT @errorReturnMessage =
			ISNULL(@errorReturnMessage, '') +  SPACE(1)   +
			'ErrorNumber:'  + ISNULL(CAST(ERROR_NUMBER() as nvarchar), '')  +
			'ErrorSeverity:'  + ISNULL(CAST(ERROR_SEVERITY() as nvarchar), '') +
			'ErrorState:'  + ISNULL(CAST(ERROR_STATE() as nvarchar), '') +
			'ErrorLine:'  + ISNULL(CAST(ERROR_LINE () as nvarchar), '') +
			'ErrorProcedure:'  + ISNULL(CAST(ERROR_PROCEDURE() as nvarchar), '') +
			'ErrorMessage:'  + ISNULL(CAST(ERROR_MESSAGE() as nvarchar(max)), '')
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