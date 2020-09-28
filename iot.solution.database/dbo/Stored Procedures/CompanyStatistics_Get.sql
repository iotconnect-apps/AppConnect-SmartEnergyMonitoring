/*******************************************************************
DECLARE @output INT = 0
		,@fieldName	nvarchar(255)
		,@syncDate	DATETIME
EXEC [dbo].[CompanyStatistics_Get]
	 @guid				= '2D442AEA-E58B-4E8E-B09B-5602E1AA545A'	
	,@invokingUser  	= '7D31E738-5E24-4EA2-AAEF-47BB0F3CCD41'
	,@version			= 'v1'
	,@output			= @output		OUTPUT
	,@fieldName			= @fieldName	OUTPUT
	,@syncDate		= @syncDate		OUTPUT
               
 SELECT @output status,  @fieldName AS fieldName, @syncDate syncDate    
 
001	SAQM-1 17-03-2020 [Nishit Khakhi]	Added Initial Version to Get Company Statistics
*******************************************************************/

CREATE PROCEDURE [dbo].[CompanyStatistics_Get]
(	 @guid				UNIQUEIDENTIFIER	
	,@invokingUser		UNIQUEIDENTIFIER	= NULL
	,@version			NVARCHAR(10)
	,@output			SMALLINT		  OUTPUT
	,@fieldName			NVARCHAR(255)	  OUTPUT
	,@syncDate			DATETIME			OUTPUT
	,@culture			NVARCHAR(10)	  = 'en-Us'
	,@enableDebugInfo	CHAR(1)			  = '0'
)
AS
BEGIN
    SET NOCOUNT ON
	IF (@enableDebugInfo = 1)
	BEGIN
        DECLARE @Param XML
        SELECT @Param =
        (
            SELECT 'CompanyStatistics_Get' AS '@procName'
			, CONVERT(nvarchar(MAX),@guid) AS '@guid'			
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

    BEGIN TRY
		SET @syncDate = (SELECT TOP 1 CONVERT(DATETIME,[value]) FROM dbo.[Configuration] (NOLOCK) WHERE [configKey] = 'telemetry-last-exectime')
		;WITH CTE_Facilities
		AS (	SELECT [companyGuid], SUM(CASE WHEN [parentEntityGuid] IS NULL THEN 1 ELSE 0 END) [totalParent],
					SUM(CASE WHEN [parentEntityGuid] IS NOT NULL THEN 1 ELSE 0 END) [totalChild]
				FROM [dbo].[Entity] (NOLOCK) 
				WHERE [companyGuid] = @guid AND [isDeleted] = 0 
				 and [Guid] not in (select entityGuid from [dbo].[Company] where [Guid]=@guid) 
				GROUP BY [companyGuid]
		)
		,CTE_DeviceCount
		AS (	SELECT [companyGuid]
						, SUM(CASE WHEN [isProvisioned] = 1 THEN 1 ELSE 0 END) [totalConnected] 
						, SUM(CASE WHEN [isProvisioned] = 0 THEN 1 ELSE 0 END) [totalDisconnected] 
				FROM [dbo].[Device] (NOLOCK) 
				WHERE [companyGuid] = @guid AND [isDeleted] = 0
				GROUP BY [companyGuid]
		)
		, CTE_Alerts
		AS (	SELECT [companyGuid], COUNT([guid]) AS [totalAlert]
				FROM [dbo].[IOTConnectAlert] I (NOLOCK)
				WHERE I.[companyGuid] = @guid AND MONTH([eventDate]) = MONTH(GETUTCDATE()) AND YEAR([eventDate]) = YEAR(GETUTCDATE())
				GROUP BY [companyGuid]
		)
		,CTE_UserCount
		AS (	SELECT [companyGuid]
		                , COUNT(1) [totalUserCount]
						, SUM(CASE WHEN [isActive] = 1 THEN 1 ELSE 0 END) [activeUserCount] 
						, SUM(CASE WHEN [isActive] = 0 THEN 1 ELSE 0 END) [inactiveUserCount] 
				FROM [dbo].[User] (NOLOCK) 
				WHERE [companyGuid] = @guid AND [isDeleted] = 0
				GROUP BY [companyGuid]
		)
		,CTE_EnergyConsumption
		AS 
		(	SELECT D.[companyGuid],SUM([sum]) AS [value] 
			FROM [dbo].[TelemetrySummary_Hourwise] T (NOLOCK)
			INNER JOIN [dbo].[Device] D (NOLOCK) ON T.[deviceGuid] = D.[guid] AND D.[isDeleted] = 0
			WHERE D.[companyGuid] = @guid AND T.[attribute] = 'currentin' AND MONTH(T.[date]) = MONTH(GETUTCDATE()) AND YEAR(T.[date]) = YEAR(GETUTCDATE())
			GROUP BY D.[companyGuid]
		)
		SELECT [guid]
				, ISNULL(L.[totalParent],0) AS [totalEntities]
				, ISNULL(L.[totalChild],0) AS [totalSubEntities]
				, ISNULL(A.[totalAlert],0) AS [totalAlerts]
				, ISNULL( U.[activeUserCount],0) AS [activeUserCount]
				, ISNULL( U.[inactiveUserCount],0) AS [inactiveUserCount]
				, ISNULL( U.[totalUserCount],0) AS [totalUserCount]
				, ISNULL(D.[totalConnected],0) AS [totalConnected]
				, ISNULL(D.[totalDisconnected],0) AS [totalDisconnected]
				, ISNULL(D.[totalConnected],0) + ISNULL(D.[totalDisconnected],0) AS [totalDevices]
				, ISNULL(CE.[value],0) AS [totalEnergy]
		FROM [dbo].[Company] C (NOLOCK) 
		LEFT JOIN CTE_Facilities L ON C.[guid] = L.[companyGuid]
		LEFT JOIN CTE_Alerts A ON C.[guid] = A.[companyGuid]
		LEFT JOIN CTE_UserCount U ON C.[guid] = U.[companyGuid]
		LEFT JOIN CTE_DeviceCount D ON C.[guid] = D.[companyGuid]
		LEFT JOIN CTE_EnergyConsumption CE ON C.[guid] = CE.[companyGuid]
		WHERE C.[guid]=@guid AND C.[isDeleted]=0
		
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